+++
title= "Networking"
subline= "a new way to wire up you computers with clan"
date= 2025-08-28T00:15:00+02:00
author= "Lassulus"
tags = ['Info', 'networking']
+++

(For a more dry and technical explanation, check out the networking docs at https://docs.clan.lol/guides/networking/)

Every now and then people ask me, what is the best overlay network/VPN? And each time I give them a long and sad answer: that all of them have different tradeoffs and there's no one size that fits all. 

Here's a quick idea of what I mean:

(This table is subjective, but is here to make a point)

| VPN | Pros | Cons |
| - | - | -
| tailscale | works pretty well | single point of failure, controller needs to be online
| tinc | no central server needed, local peer discovery | sometimes unreliable, questionable maintenance
| zerotier | no public server needed, continues working if controller is down | BSL, single point of failure (controller), relying on 3rd party servers
| tor | no central server needed, anonymous (probably) | no UDP, slow
| mycelium | no central server needed | unreliable
| yggdrasil | reliable (if setup right) | hard to setup, no local peer discovery
| wireguard | fast, native kernel support | no auto peering, no TCP fallback


There are some more VPN solutions that I haven't tried yet, but there is no ultimate solution and each comes with certain pros and cons. For this reason we have built a network abstraction into Clan that will choose the best network for all the actions you want to run on a remote machine.

## How it works

First, you must enable a network-capable Clan Service. At the time of writing, there are only two (because I've been too lazy to add more): `tor` and an `internet` service. The `tor` service connects through the Tor network to a hidden service running on the target machine. The `internet` service requires manual configuration of IP addresses.

Lets look at an example:

```nix{file=flake.nix}
...
  inventory.instances = {
    tor = {
      roles.server.tags.nixos = {};
    }
  }
...
```

This would enable the `tor` service on all `nixos` machines.


A network is then exposed with a priority and an attribute set of peers into the global flake, which you can examine with the following command:

```bash
clan select 'clan.exports.instances.*.networking.{priority,peers}'
```

The output should look something like this:
```
{
  "blabla": {}
  "tor": {
    "priority": 10,
    "peers": {
      "my_cool_machine": {
        SSHOptions": [],
        "host": {
          "var": {
            "file": "hostname",
            "generator": "tor_tor",
            "machine": "my_cool_machine"
          }
        },
        "name": "my_cool_machine"
      }
    }
  }
}
```

You can see the default priority of `10` and a list of peers corresponding to your machines. 

A `host` entry can either be a plain value or a `var` (as above) which gets decrypted on demand when used. We do this to prevent our Tor hidden service hostnames from being exposed publicly

> __NOTE:__ If you install a machine after enabling the `tor` service you will have to manually update the machine with `--target-host` one last time, after which the `tor` vars for that machine will to be generated and deployed.

You can try out the new networking with:

```bash
clan ssh my_cool_machine
```

This should log you into the target machine via Tor (or something faster if you have another network configured). If you have no Tor daemon running on your system, it will start one for the duration of the connection (thats pretty rad).

The JSON output from the `clan select` command earlier is a bit annoying to type and the output a bit hard to read, so for this reason we built a nicer interface for interacting with networks:

```bash
clan network list
```

This prints a list of all the networks you have configured. For our test case it would look like this:

```
Network       Priority  Module      Running   Peers
---------------------------------------------------
tor           10        tor         No        my_cool_machine
```

(This is only cool with multiple networks).


We can now have multiple networks configured and let the Clan cli decide on the best way to reach our machines via those networks from our admin machine. 

## What is still missing?

Sadly, a lot. Here is a short list of the top of my head:

- Currently only works for `admin -> machine` connections. Ideally we want them for `machine <-> machine` connections as well
- More network modules like mycelium and zerotier
- Userspace networking, like the Tor daemon with on-demand starting. We want to have the same behaviour for all kinds of networks.

There's likely more features I can't think of which are missing, so stay tuned for more networking related blogposts in the future :)
