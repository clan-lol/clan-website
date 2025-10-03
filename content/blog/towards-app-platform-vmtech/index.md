+++
title= "Towards a secure peer-to-peer app platform for Clan"
subline= "feat. Nix, microVMs, and GPUs"
date = 2025-09-26T06:30:00-03:33
draft = false
author = "Val Packett"
tags = ['Dev Report']
+++

While most of the existing Clan framework is dedicated to machine and service management, there's more on the horizon. Our mission is to make sure peer-to-peer, user-controlled, community software can beat Big Tech solutions. That's why we're working on platform fundamentals that would open the way for our FOSS stack to match the usability and convenience of proprietary platforms.

Unfortunately, the FOSS world is still lagging behind commercial platforms in some important aspects:

- Web and mobile apps are strongly sandboxed, so while they can get very aggressive in snooping on the data they *are* allowed to access, the enforcement of the isolation model is very robust — and there is a model for *sharing* data that makes the isolated applications actually useful..
	- Meanwhile in the FOSS world, it's still extremely common to run software with full access to the user's account. The only project that has built anything close to a similar platform for local software is Flatpak, which is still not perfect and its main repo has a very lax policy;
- Centralized Web services can have "multiple instances" simply by switching accounts; self-hosting Web services is trivially multi-instance; even Android now provides a multi-instance facility..
	- Meanwhile local software often doesn't have a global database, but when it does, it can be impossible to make it multi-instance without advanced knowledge;
- Commercial apps come with their own always-online remote servers. Users don't have to think about connecting the clients to the servers, it's all pre-connected!
	- Meanwhile decentralized community software is stuck between various bad options. Supporting multiple commercial backends is tedious and defeats the point anyway. Self-hosting traditional web servers can get complex and unreliable, and exposes attack surface to the public Web. Direct peer-to-peer connections can be hard to set up and unreliable too, and typically don't provide asynchronous communication.

So… What do we need to make it possible for communities to share apps install and load **quickly**, already **pre-connected** to network services; are isolated to a **worry-free** level of security, and yet allow for enough **sharing** via explicit permissions to make them useful?

The first piece of the puzzle is, unsurprisingly, Nix. The entire Clan project is built on Nix, and the future app platform is no exception. Nix makes it possible to quickly fetch and run any software – thanks to caching, as long as we steer everyone towards using very few common versions of the nixpkgs tree, most downloads could be almost as fast as web app loads.

Then we have to add a **microVM hypervisor** with **Wayland and GPU virtualization** and a side of **D-Bus portals**… and we can finally get a glimpse of the future!

{{< video key="munixfx" autoplay="true" muted="true" loop="true" >}}

## microVMs

Secure isolation is essential for any modern app platform. Hardware-based virtualization is a lot more confidence-inspiring than shared-kernel isolation mechanisms like Linux namespaces. But it's not *only* a security measure. Running apps in VMs also improves environment consistency/reproducibility by ensuring everyone runs the same kernel — which can also give us portability, since it enables running on completely different host OSes as well.

If your experience with virtualization on desktop has only been with booting entire Linux distros under something like VirtualBox, you might be very skeptical of the same technology being involved in launching applications all the time. But that's not at all inherent to the use of KVM!

Conventional VMs feel "heavy" —slow to launch, big RAM footprint, extra background CPU usage, fixed storage allocation, usually not very well integrated with the host desktop— only because their goal is to simulate a whole another computer within your existing computer. For app isolation, we don't need that, so the whole stack can be vastly simplified and optimized for high performance and low overhead. The microVM idea was first popularized by AWS's [Firecracker](https://firecracker-microvm.github.io/) on the server side, powering instantly-launching event/request handlers in Lambda. A microVM boots directly into the kernel (skipping firmware) and does not emulate any legacy PC hardware, which results in *very* fast boot times, on the order of a couple hundred milliseconds.

Now, has this been used on the client side already? Yes, most prominently by Asahi Linux, motivated by a technical restriction that was preventing Apple machines from playing legacy Windows games. That's the [muvm](https://github.com/AsahiLinux/muvm) project, powered by [libkrun](https://github.com/containers/libkrun) – a Firecracker-like VMM provided as a dynamic library so that different frontends could be built. For our platform development, we have indeed adopted muvm (after submitting [some changes](https://github.com/AsahiLinux/muvm/pull/192) that make it more useful for us), combining it with namespace-based [Bubblewrap](https://github.com/containers/bubblewrap) to make a script that [runs NixOS system closures](https://git.clan.lol/valpackett/munix) in microVMs.

…Wait, did someone mention playing games– like, highly GPU-demanding games? In a VM? Without a dedicated GPU?

## Desktop and GPU support

{{< video key="munixvelooooren" autoplay="true" muted="true" loop="true" >}}

In the Beginning (of virtio-gpu), there was the Framebuffer. An emulated computer monitor, a single rectangle representing the entire graphical output of the VM. Then there was [VirGL](https://docs.mesa3d.org/drivers/virgl.html), a way to forward the OpenGL API across the VM boundary to make the host render on its GPU on behalf of the VM, so that 3D graphics could be displayed on the emulated monitor. It wasn't super fast, it wasn't compatible with the latest GL extensions, it wasn't very secure, but it was something. With the advent of Vulkan, [Venus](https://docs.mesa3d.org/drivers/venus.html) was started as the Vulkan version of the same thing.

Meanwhile, the Chrome OS team was working on adding support for Linux apps. While it was initially based on namespaces, they quickly started working on switching to hardware virtualization. The virtio-gpu device was extended to support arbitrary "cross-domain" protocols, making it possible —with some wrapping-unwrapping— to forward Unix domain sockets that pass certain types of file descriptors (shared memory and DMA-BUF) to the guest. (Well, initially it was a whole separate virtual device but let's skip over that.) Google's crosvm supports [connecting to the host Wayland socket](https://crosvm.dev/book/devices/wayland.html) to that facility, and the team wrote [Sommelier](https://chromium.googlesource.com/chromiumos/platform2/+/refs/heads/main/vm_tools/sommelier/README.md) as the guest-side proxy that exposes a normal Wayland socket to guest apps.

The part of crosvm responsible for handling the virtio-gpu device was written as a reusable library called Rutabaga (now [living outside of the CrOS repos](https://github.com/magma-gpu/rutabaga_gfx)), and integrated into other VMMs such as good old Qemu. Sommelier was packaged by various Linux distros as well, and one enthusiast wrote [an entire alternative to Sommelier](https://roscidus.com/blog/blog/2021/03/07/qubes-lite-with-kvm-and-wayland/).

Meanwhile, there was also a lot to improve in terms of accessing the GPU. As we've mentioned already, API forwarding solutions like VirGL/Venus leave a lot to be desired. PCIe passthrough requires a dedicated GPU, or SR-IOV support which GPU vendors have mostly restricted to enterprise models. However… of course a better way was possible! Rob Clark presented [DRM native contexts](https://indico.freedesktop.org/event/2/contributions/53/attachments/76/121/XDC2022_%20virtgpu%20drm%20native%20context.pdf) at XDC 2022: this approach essentially paravirtualizes the kernel-space GPU driver, letting the guest submit hardware-specific commands that the host would run in separate contexts (relying on the same separation as between programs on the host). That's the approach that was picked up by the Asahi Linux project for gaming because of the amazing performance it allows for, but it's also intended to be a stronger security boundary due to providing way less attack surface on the host (it's all I/O management rather than implementing complex APIs).

So, was it possible to take all of this technology and use it? Well… it required quite a bit of debugging and fixing everywhere – but that's exactly why I joined! So far I've discovered that:

- the rutabaga_gfx integration in QEMU (which was the thing we tried to use initially) and other C consumers was broken with the latest versions due to [an `ifdef` mistake](https://issuetracker.google.com/issues/440386997) ([fixed](https://github.com/magma-gpu/rutabaga_gfx/pull/9))
- it's not documented everywhere that [kernel >= 6.13 is required](https://gitlab.com/qemu-project/qemu/-/issues/2574) to be able to touch AMD GPU memory from KVM guests in any way
- Sommelier was [assuming Chromium OS kernel patches](https://issuetracker.google.com/u/2/issues/441537635) and misinterpreting `ioctl` responses on regular mainline Linux
- libkrun's internal version of rutabaga_gfx contained a tiny strange API modification incompatible with Sommelier/proxy-virtwl and didn't handle memfd seals ([fixed](https://github.com/containers/libkrun/pull/407))
- RADV (Radeon Vulkan driver in Mesa) only recognized PCI devices including for virtgpu, ignoring the `virtio-mmio` setup used by libkrun ([fixed](https://gitlab.freedesktop.org/mesa/mesa/-/merge_requests/37281))

And we're continuing with more work in this area.

## D-Bus / XDG Desktop Portals

{{< video key="munixportal" autoplay="true" muted="true" loop="true" >}}

Application isolation is great, but completely isolated applications tend to have limited usefulness. That's why we're also integrating [desktop portals](https://flatpak.github.io/xdg-desktop-portal/) that Flatpak uses —at least the file-opening / document portal— into the microVM-based platform.

The [sidebus](https://git.clan.lol/valpackett/sidebus) project is inspired by [Spectrum](https://spectrum-os.org/)'s setup for using the document portal with virtiofs to dynamically expose chosen files to the guest, using vsock as the D-Bus transport. It is based on the [busd](https://github.com/dbus2/busd) broker library, and uses the portal frontend on the host for perfect integration with arbitrary desktop environments.

With the switch to libkrun however, we are looking at the possibility of making the Camera and Screencast portals working, with full hardware acceleration – by switching to virtgpu cross-domain as the transport instead of vsock. Currently libkrun already has added some PipeWire support to its copy of rutabaga_gfx, however that's fixed to one system-wide socket. How these portals work is that for every request they pass a new restricted PipeWire remote socket over D-Bus. So we're looking to make rutabaga's cross-domain sockets more generic, to be able to just pass through that whole chain of file descriptor passing.

(And yes, lots of people are worried about PipeWire attack surface — it's definitely possible to mitigate that with a proxy on the host that would only allow a small validated subset of the PipeWire protocol.)

## Conclusion

We're looking to finally make a peer-to-peer community software platform that's competitive with commercial ones in terms of security, usability and convenience. Stay tuned!
