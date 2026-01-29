+++
title = "Debugging Offline Nix Builds"
subline = "A journey through hermetic builds, mass rebuilds, and network injection hackery"
date = 2026-01-29T12:00:00+00:00
draft = true
author = "Jörg Thalheim"
tags = ['Dev Report', 'Nix', 'Testing']
+++

I was trying to get our new container-based NixOS tests working.
Should be simple, right? Run `nixos-rebuild` inside a container, verify the configuration applied correctly, done.

Instead, I watched Nix attempt to build what felt like half of nixpkgs from source…

## The Setup

We've been working on running NixOS tests inside systemd-nspawn containers rather than full QEMU VMs. It's faster, uses fewer resources, and works in the Nix build sandbox. The test modifies a NixOS configuration and runs `nixos-rebuild switch` to apply it.

The problem? The container has no network access. It runs inside Nix's build sandbox, which isolates network by design. We pre-populate the Nix store using `closureInfo`, but if we miss even a single dependency, Nix can't fetch it as a substitute. It has to build from source. And since dependencies have dependencies, missing one small package can cascade into rebuilding thousands.

This isn't the first time I've hit this. When working on [nixos-anywhere](https://github.com/nix-community/nixos-anywhere) and [disko](https://github.com/nix-community/disko), I ran into similar issues with hermetic builds. The pattern is always the same: something is missing from the closure, but good luck figuring out what.

## The Usual Debugging Experience

Normally when this happens, you stare at a wall of build output. Nix is compiling GCC. Why is it compiling GCC? You didn't change anything related to GCC. You scroll back through thousands of lines trying to find the root cause. Maybe you give up and add more packages to your closure, hoping one of them fixes it.

This time I wanted a better approach.

## The Key Insight: `nix build --dry-run`

The `--dry-run` flag is the hero here. It shows what Nix *would* build or fetch without actually doing it:

```console
$ nix build --dry-run .#yourPackage
```

The output has two sections:

* **Derivations to be built**: packages that must be built from source
* **Paths to be fetched**: packages that would be downloaded from a binary cache

In a properly configured hermetic environment, that second list should be empty. Any paths there are exactly what's missing.

But here's the catch: `--dry-run` needs network access to query the binary cache. And our test runs in a sandbox with no network.

## Getting Network Access Into the Sandbox

For regular NixOS VM tests, this is straightforward. You build the test driver and run it outside the sandbox:

```console
$ nix build .#checks.x86_64-linux.yourTest.driver
$ ./result/bin/nixos-test-driver
```

The interactive driver has network access, so you can run `nix build --dry-run` inside the VM.

For container tests, it's more complicated. The container runs inside the Nix sandbox's user namespace (needed for the `uid-range` feature). We can't just disable the sandbox because we need those namespaces.

The solution? Inject network after the container starts.

## Pausing the Test

The container test driver exposes a `wait_for_signal()` helper that tests can call to pause and wait for SIGUSR1. Add it to your test script where you want to pause:

```python
start_all()
machine.wait_for_unit("multi-user.target")

# Pause here to allow network injection
wait_for_signal()

# Continue with the test...
```

When it pauses, the test driver prints a command you can run to inject network and continue:

```
DEBUG MODE: Test paused, waiting for SIGUSR1...

To inject external network and continue test, run:
sudo /nix/store/...-python3/bin/python3 /nix/store/...-test-driver/.../inject_network.py <uuid>
```

We've packaged all of the network injection logic into an [`inject_network.py`](https://git.clan.lol/clan/clan-core/src/commit/64f101cb733f2a50b38b8481da54f85afb2043ab/lib/test/container-test-driver/test_driver/inject_network.py) script. Just copy and run the command printed by the test driver. It finds the container, injects network, signals the test to continue, then waits for Ctrl-C to clean up.

## How Network Injection Works

The container test driver prints a UUID when it starts. The script uses that to find the container process and inject a network interface. Here's how it works step by step.

First, find the container process using the UUID:

```console
$ pgrep -af 'abbc0409-94bb-4218-95b4-60b1fd13e4c2'
276568 /bin/sh -c /nix/store/.../sleep 999999999 && echo abbc0409-94bb-4218-95b4-60b1fd13e4c2
```

Create a veth pair on the host:

```console
$ sudo ip link add veth-host type veth peer name veth-inject
```

Move one end into the container's network namespace:

```console
$ sudo ip link set veth-inject netns "/proc/276568/ns/net"
```

Configure the host side:

```console
$ sudo ip addr add 10.99.0.1/24 dev veth-host
$ sudo ip link set veth-host up
```

Now here's the trick: we need to enter both the user namespace and network namespace to configure the container side. Just `--net` alone fails with "Permission denied":

```console
$ sudo nsenter --user --net --target 276568 -- ip addr add 10.99.0.2/24 dev veth-inject
$ sudo nsenter --user --net --target 276568 -- ip link set veth-inject up
$ sudo nsenter --user --net --target 276568 -- ip route add default via 10.99.0.1
```

Don't forget DNS! The container's `/etc/resolv.conf` is likely a symlink, so remove it first:

```console
$ sudo nsenter --user --mount --target 276568 -- rm -f /etc/resolv.conf
$ sudo nsenter --user --mount --target 276568 -- sh -c 'echo "nameserver 8.8.8.8" > /etc/resolv.conf'
```

Enable NAT on the host:

```console
$ sudo sysctl -w net.ipv4.ip_forward=1
$ sudo iptables -t nat -A POSTROUTING -s 10.99.0.0/24 -j MASQUERADE
```

Test connectivity:

```console
$ sudo nsenter --user --net --target 276568 -- ping -c 1 8.8.8.8

PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=119 time=24.3 ms
```

The `inject_network.py` script automates all of these steps. It also cleans up the veth pair and NAT rules when you press Ctrl-C.

## Running the Dry-Run

With network injected, SSH into the container and run the dry-run:

```console
$ ssh root@192.168.1.1 'cd /flake && nix build --dry-run \
    .#nixosConfigurations.test-machine.config.system.build.toplevel'
```

Here's what I got:

```
these 9 derivations will be built:
  /nix/store/04r01g9s2ckfs4v64gx426r1ac3ssamy-etc-update-build-local-successful.drv
  /nix/store/fyi5gy25qcncs8zf9vxnlb54yah66fs5-stage-2-init.sh.drv
  /nix/store/gbnayc92q4q82jdrcnzfdpm2fw0acgfm-dry-activate.drv
  /nix/store/jf3sixnjh3v7x6fjs1rd0i9hqd9pzsjv-etc.drv
  /nix/store/lhvslpfnh3nr978m0c862qxsl3dnzymi-activate.drv
  /nix/store/hvxxm22ddlig6lvn8pifxa7kpb67acq6-builder.pl.drv
  /nix/store/pv0dybshsabgxf6n8wmdq64lgdimx4pf-perl-5.42.0-env.drv
  /nix/store/xsffzqw02ng2a4dryhxx2pwmndm7cymb-check-sshd-config.drv
  /nix/store/6639244qzcgn3bhvv2gq4kd4ybdvvgl7-nixos-system-update-machine-.drv

these 3 paths will be fetched (0.00 MiB download, 0.01 MiB unpacked):
  /nix/store/4w0spqkn44zlrys9y93x06h949dvcpj8-ensure-all-wrappers-paths-exist
  /nix/store/48zc854y65q0jvsa2na6liawgqvh69cq-make-shell-wrapper-hook
  /nix/store/r0ddi8vysis4rdlqjkv9jp68b8d41i4k-openssh-10.2p1-dev
```

The 9 derivations are expected. That's the new configuration we're building. The 3 paths to be fetched are the problem.

## Finding the Packages

Store paths have human-readable names, but we need the actual Nix expressions to add them to `closureInfo`.

For `make-shell-wrapper-hook`, we can verify the package name:

```console
$ nix eval nixpkgs#makeShellWrapper --apply 'x: x.name'
"make-shell-wrapper-hook"
```

For `-dev` outputs like `openssh-10.2p1-dev`, it's usually the main package with `.dev`:

```console
$ nix eval nixpkgs#openssh.dev --apply 'x: x.name'
"openssh-10.2p1"
```

For NixOS-internal stuff like `ensure-all-wrappers-paths-exist`, grep the nixpkgs source:

```console
$ grep -r "ensure-all-wrappers-paths-exist" nixos/modules/
nixos/modules/security/wrappers/default.nix:      pkgs.runCommand "ensure-all-wrappers-paths-exist"
```

This one is generated by the module system and should be part of the system toplevel closure. If it's missing, it usually means the toplevel itself wasn't properly included.

## The Fix

Add the missing packages to `closureInfo`:

```nix

closureInfo = pkgs.closureInfo {
  rootPaths = [
    # ... existing paths ...
    pkgs.makeShellWrapper
    pkgs.openssh.dev
  ];
};
```

After adding these, the test ran successfully. Only those 9 derivations got built, no mass rebuild. :white_check_mark:

## A Note on `.drvPath`

You might be tempted to include `pkg.drvPath` to get the full build-time closure of a package. Be careful with this. It's the nuclear option that can pull in a massive closure of build-time dependencies.

Two problems:

* **Slower test startup**: Every path in the closure gets registered with the test's Nix store database
* **Unnecessary downloads**: You might download gigabytes of stuff you don't need

Only use `.drvPath` for specific packages where you've verified it's necessary:

```nix

rootPaths = [
  myPackage           # Runtime closure, safe
  pkgs.stdenv.drvPath # Build-time closure, use sparingly
];
```

## Conclusion

The key takeaway: `nix build --dry-run` tells you exactly which paths are missing from your hermetic environment. The "paths to be fetched" list is your hit list.

For VM tests, run the driver interactively. For container tests or other sandboxed builds, you'll need to inject network access temporarily. The veth + nsenter approach works but requires some namespace gymnastics.

It's not pretty, but it saves a lot of time, staring at build logs trying to figure out why Nix is mass-rebuilding dependencies.
