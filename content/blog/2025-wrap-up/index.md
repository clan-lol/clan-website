+++
title = 'Clan 2025 Wrap-Up: From Infrastructure to a New Computing Paradigm'
subline = 'A look back at what we built in 2025 and where Clan is heading next'
date = 2026-01-12T00:00:00+00:00
draft = true
authors = ["catsnacks"]
tags = ['Dev Report']
+++

## Why Clan Exists

Clan's core mission is to make [digital sovereignty](https://en.wikipedia.org/wiki/Digital_sovereignty) accessible to everyone. Clan is not a platform or a product; it is a free, open source framework that empowers people and groups to customize and manage machines within safe, secure, private networks that they alone control. Clan is built to be deeply composable (i.e. systems built from small, interoperable building blocks), reliably reproducible, and entirely self-sovereign.

2025 delivered many forceful reminders of why this mission is more important and urgent than ever. From the rise of technocratic institutions, to increasingly invasive adversating, to the [war on general-purpose computing](https://doctorow.medium.com/https-pluralistic-net-2026-01-01-39c3-the-new-coalition-4a7a582ff5b7) still raging, we are inundated with technology designed to exploit, surveil, manipulate and extract from us. We won't escape this mess through lobbying, interoperability or clever workarounds. It's time for an exit, a full reset. 

In direct opposition to the capture-and-extract model that dominates the tech sector, Clan is designed to empower anyone to build a digital life that is completely their own. No dark patterns, no rent, no data tax, no black boxes, no backdoors, no copyrights or access controls. Just free, open source, composable infrastructure for truly personal computing – the foundation of a fully sovereign computing stack.

## 2025 In Review

2025 culminated in the [announcement of our first stable release](https://git.clan.lol/clan/clan-core/src/branch/main/docs/site/releases/25-11.md), marking a shift in mindset: Clan is no longer an experiment. It is stable infrastructure that people depend on. We were thrilled this year to see Clan growing beyond the realm of enthusiasts' homelabs and being used in production for business applications by corporate sysadmins. With this release comes a commitment to predictable behaviour, careful evolution, and responsibility toward users and contributors who are building on top of it.

Read on for more of the exciting milestones we achieved in 2025, both strengthening the foundations of Clan and exploring the horizons of where it can take us in the future. 

### Networking / VPN work and reliability gains

Reliable networking is foundational for Clan. If machines can't find each other, stay connected, or recover gracefully from failures, nothing else matters. Over the past year, much of our work has focused on making [peer-to-peer networking](https://en.wikipedia.org/wiki/Peer-to-peer) more robust, flexible, and predictable.


One recurring lesson is that there is no single "best" VPN or [overlay network](https://en.wikipedia.org/wiki/Overlay_network). Every solution comes with tradeoffs. Some rely on centralized controllers; others are fully peer-to-peer, but unreliable or difficult to operate. Some are fast but fragile, others are resilient but slow (see [here](https://vpnbench.clan.lol) for a detailed comparison). Instead of betting on one network to rule them all, we take a different approach.


Clan introduces a networking abstraction that allows multiple network technologies to coexist. Rather than forcing users to choose upfront, Clan can automatically select the best available network for a given machine. Networks are treated as services that can be enabled declaratively, assigned priorities, and attached to machines through tags. The Clan CLI then transparently uses the most appropriate network when connecting to a machine.


This abstraction has already led to significant gains in reliability. Clan commands now automatically pick up network configuration from the Clan [flake](https://nixos.wiki/wiki/Flakes) for most operations, removing the need for users to manually specify hosts, IPs, or connection methods. Sensitive connection details, such as [Tor](https://www.torproject.org/) hidden service addresses, are handled securely through Clan's secret system and only decrypted when needed.


Today, this enables admin-to-machine connectivity over networks such as Tor or the public internet, with support for on-demand networking services that start only when required. The result is a system that is more resilient to outages, avoids unnecessary exposure to the public web, and continues working even when individual network components fail.


Looking ahead, this networking layer becomes even more important. Users can already add their own network services to Clan, and in the coming year, we plan to extend the model further by enhancing [machine-to-machine](https://en.wikipedia.org/wiki/Machine-to-machine) networking, supporting additional overlay networks, and unifying [userspace networking](https://en.wikipedia.org/wiki/User_space) across all providers. The goal is simple but ambitious: networking that "just works," without hiding complexity behind a fragile abstraction, and without reintroducing centralized points of control.


### Micro VMs

If Clan is about sovereign machines and networks, the next challenge is sovereign applications. 

Today's proprietary platforms have set a very high bar for usability and security. Commercially hosted web and mobile apps are heavily [sandboxed](https://en.wikipedia.org/wiki/Sandbox_(computer_security)) by default, can run multiple instances, and are always pre-connected to the services they need. In contrast, much of the peer-to-peer software world is still made up of applications that are complicated to install and configure, have unclear security boundaries, rely on complex or unreliable [client-server protocols](https://en.wikipedia.org/wiki/Client%E2%80%93server_model) and are limited to a single instance. As powerful as a lot of this software is, it is often also unsafe, cumbersome, and limiting.

To close this gap, we've been exploring [micro VMs](https://openmetal.io/resources/blog/microvms-scaling-out-over-scaling-up/) to make running peer-to-peer applications **safer, more convenient and more flexible**.

**Safer:** Rather than the shared-kernel isolation of e.g. [Linux namespaces](https://en.wikipedia.org/wiki/Linux_namespaces), micro VMs use [hardware virtualization](https://en.wikipedia.org/wiki/Hardware_virtualization) to maintain strong security boundaries between applications. This means software you run inside a micro VM environment has no connection to your primary system or any other programs you're running, so any vulnerabilities stay contained. 

**More convenient:** By running applications inside a micro VM, we can make sure software loads the same for everyone, regardless of what OS they're using. [Nix](https://nixos.org/)'s caching and reproducible builds mean programs can launch almost as quickly as web apps, while remaining fully local and user-controlled. Best of all, Clans are ready-made peer-to-peer networks, so communication between them is already established and traffic never needs to touch hosted servers or the open web. 

**More flexible:** Unlike traditional virtual machines, micro VMs are extremely lightweight and can start in a few hundred milliseconds. An everyday desktop or laptop can run a micro VM - or several - that operates in isolation, enabling a user to e.g. bypass compatibility issues, run multiple instances, experiment with different configurations or create an ad hoc environment for a specific purpose. 

A key requirement for making all of this practical is deep desktop integration, including [graphics acceleration](https://en.wikipedia.org/wiki/Hardware_acceleration). We've been working on GPU-accelerated micro VMs using modern [virtio-gpu](https://pve.proxmox.com/wiki/Windows_VirtIO_Drivers) techniques, enabling [Wayland](https://wayland.freedesktop.org/)-based graphical applications to run inside micro VMs with near-native performance, without requiring dedicated GPUs or enterprise-only hardware features.


{{< video key="munixvelooooren" muted="true" loop="true" controls="true" >}}


Of course, isolation alone isn't enough. Applications still need controlled ways to share data with users and with each other. To enable this, we're integrating D-Bus–based [desktop portals](https://flatpak.github.io/xdg-desktop-portal/), similar to those used by [Flatpak](https://flatpak.org/), allowing applications to request access to files, cameras, or screens through explicit, user-mediated permissions. This preserves strong isolation while keeping applications genuinely useful.


Together, Nix, micro VMs, GPU acceleration, desktop portals, and [mesh VPNs](https://tailscale.com/learn/understanding-mesh-vpns) form the basis of a local application platform that is secure by default, fast enough for daily use, and naturally compatible with peer-to-peer networking. As a result, even applications that were never designed for P2P use can be safely retrofitted to work in distributed, self-hosted environments. This work is still evolving, but it represents a critical step toward making community-owned, self-hosted software competitive with proprietary platforms, without sacrificing user experience or sovereignty.


Looking ahead, the next step is to integrate micro VMs more deeply into Clan itself. This includes first-class support in the Clan CLI and, over time, exposing micro VM-based applications and services through the Clan GUI. Our goal is to make strong isolation, reproducibility, and secure application sharing feel like a natural part of managing a Clan, not a separate or specialized workflow.


Our first explorations in this area have focused on deploying micro VMs within NixOS systems, but in the future we will extend this approach to make Clan itself portable: a complete operating environment in a replicable, shareable package, so a user can join a Clan even if they don't have NixOS installed.


We want to take this opportunity to express our gratitude to our friends at [Qubes OS](https://www.qubes-os.org/) for introducing us to the amazing [Val Packett](https://github.com/valpackett), who has been driving this line of experimentation.

### Clan GUI

Strong, safe defaults are a necessary foundation, but for many people, they are still not enough. Especially for those unfamiliar with NixOS, even a well-chosen default configuration leaves too much implicit knowledge unstated. Understanding how machines relate to each other, how services are composed, how secrets are managed, or how changes propagate across a network still requires expertise most users don't have. 


To make Clan accessible beyond experienced Nix users, we needed a more legible way to understand and operate a Clan of machines. This is why we started building the Clan GUI, [which we introduced at NixCon](https://static.clan.lol/videos/nixcon-2025.mp4). 


The GUI does not replace Nix or the Clan CLI; it builds on top of them. Where the CLI is precise and powerful, the GUI makes the system visible and approachable, especially for collaborators who shouldn't need to touch configuration files to participate. 

{{< video key="clan-gui-demo" autoplay="true" loop="true" mute="true" >}}

At its core, the GUI reflects Clan's opinionated deployment framework. It focuses on the hardest parts of self-hosting: bootstrapping machines, managing secrets, wiring services across multiple systems, and understanding what is running where. A declarative secret management system allows services to opt into their own secrets before deployment, enabling automatic generation, secure storage, rotation, and testing, all exposed consistently through both CLI and GUI.

{{< video key="monitoring-alert" autoplay="true" loop="true" mute="true" >}}


On top of this sits client services: a multi-machine service layer that makes it possible to define shared infrastructure once and apply it across groups of machines using tags. Because this layer is [JSON](https://en.wikipedia.org/wiki/JSON)-compatible, services can be added, removed, or reconfigured through the GUI while remaining fully compatible with Nix-based workflows.


The result is an interface that makes infrastructure easier to understand. Machines appear as part of a network, can be grouped and tagged, and have services applied visually. This makes Clan usable not only by the person who set it up, but also by families, teams, and collaborators.


The Clan GUI is still in early development and today complements, rather than replaces, the CLI. But it already points toward the future: sovereign infrastructure that is not just powerful, but understandable - and maybe even fun.

{{< figure src="https://static.clan.lol/videos/25_06_clan-gui-screenshot.png" >}}

### **Secrets and computed values, rethought**

In 2025, [we replaced our initial secret management approach ("facts") with vars](https://clan.lol/blog/vars/), a declarative framework that allows services to define how secrets and other values are generated, shared, and rotated across machines. This removed much of the manual bootstrapping traditionally required when deploying infrastructure and made both CLI and GUI workflows more reliable. Looking ahead, we are continuing to move vars to the flake level, attaching secrets to services rather than individual machines to further improve scalability, usability, and cross-machine coordination.

### **Inventory: from single machines to fleets**

NixOS excels at configuring individual machines. Clan extends this paradigm to groups of machines by introducing an inventory and service layer abstraction. This makes it possible to define services, users, secrets, and relationships once and apply them consistently across many machines. It's a critical shift from "machine configuration" to "infrastructure configuration," and underpins everything from networking to future collaboration features.


```nix
inventory.instances = {
    # One declaration enables VPN across all machines
    zerotier = {
      roles.controller.machines.server = { };
      roles.peer.tags = [ "all" ]; # All machines join the network
    };
  };
```

You can read more of about the inventory [here](https://docs.clan.lol/main/guides/inventory/inventory/).

### **Service exports and composability**

Clan services can now export values that other services can consume. This allows different parts of the system to wire themselves together automatically, for example, enabling VPN configuration to be reused by higher-level services without manual glue code. The result is a more composable system where services cooperate instead of being configured in isolation.

```nix
perInstance = { mkExports, machine, ... }: {
    exports = mkExports {
      peer.hosts = [
        {
          plain = clanLib.getPublicValue {
            machine = machine.name;
            generator = "mycelium";
            file = "ip";
            flake = directory;
          };
        }
      ];
    };
  };
```

You can read more of how exports work [here](https://docs.clan.lol/main/guides/services/exports/).

### **macOS as a first-class Clan member**

In 2025, [Clan gained full support for managing macOS machines via nix-darwin](https://clan.lol/blog/macos/). MacOS systems can now participate in the inventory, receive declarative configuration, manage secrets, and be deployed from — or deploy to — other Clan machines. This matters because real-world Clans are heterogeneous: families, teams, and communities rarely run Linux everywhere. Supporting macOS makes Clan viable in mixed environments and lowers the barrier to adoption.

# What's next

In dry technical terms, we describe Clan as a peer-to-peer computer management framework. But this idea is deceptively radical: if anyone is free to create secure, autonomous networks, with self-hosted data and services, then we are also free to completely reimagine what it means to be online. The monolithic dead internet, the so-called "global public square", could be replaced by a living web of individual spaces – some public, some private, all opt-in and entirely self-determined.


However, this also presents a challenge: in a world where one person belongs to many Clans and connects to as many internets, how do they navigate? How do they keep track of where they are, where their people are, what is private and what is public? 


No matter how secure the technical foundation might be, it won't accomplish anything unless it's also usable. So we've started to experiment with different technologies that could weave these pieces together - to determine how multiple networks and applications could exist on the same machine, how those machines could find each other, offer services, exchange resources and more. Micro VMs and Clan GUI are the first, still ongoing, efforts in this direction. The following initiatives are still in early stages of research and prototyping, but we're excited to share this first glimpse of what's on the horizon.

### Spaces

Spaces is a free and open source operating environment designed to make digital sovereignty the norm by building Clan in at the base level. The networked machines in a Clan represent a group of human beings and the connections between them; Spaces give those connections a tangible form. If your Clan is your village, then spaces are the rooms and common areas where you live, work, and gather together.

{{< video key="create-space" controls="true" >}}


**Create and share spaces:** Customize spaces for work, family, gaming, art, life admin, or anything else you use your computer for. Each space can have its own look and feel, organization, tools, and access rules. One space might be completely private, cut off from the internet, so you can store sensitive files knowing there's no way for anyone to get in. In another, you might add your family or work Clan. Or you could create a space that's completely open and discoverable by anyone.


**Multiplayer by default:** People in a shared space are connected at the OS level - no crashed website, censored platform or cloud outage can keep them apart.


**Isolation by design:** A space is a self-contained environment, completely isolated by default, so what you do in one space won't affect the security or functionality of another – even if they're running on the same machine.


**No platform purgatory:** Essential tools such as messaging, video chat, shared files, collaborative docs, wallets, and more are built in as modular services and widgets, available to anyone who joins the space. No need for everyone to download anything or make an account anywhere – just get straight to doing whatever you do, together.


**Own your OS:** Your computer, operating system, and online spaces are entirely your own. Create your own tools, apps and widgets, customize and share them with your Clan or with the whole world. No coding required - Spaces Playground will help you create whatever you dream up with a few text prompts.


There's much more on the horizon - we'll follow up with a dedicated post about Spaces in the coming weeks. 


### Clan and LLMs

We are deliberately not part of the current AI hype cycle. Calling large language models "AI" is, in our view, misleading at best. These systems are not intelligent in any meaningful sense, and framing them as such obscures both their limitations and the real risks of concentrating power in opaque, corporate-controlled systems. We are also wary of how LLMs are currently used to replace clear interfaces, obscure system behavior, or paper over poor design. Clan remains fundamentally **declarative, inspectable, and deterministic by default**. Power users should always be able to reason about, audit, and reproduce their systems without a chat window in the way.


That said, large language models *are* a powerful piece of technology. Especially when combined with open source software, self-hosting, and strong isolation guarantees, they can become genuinely useful tools rather than extractive platforms.


For Clan, the key condition is non-negotiable: **LLMs must be able to be self-hosted and locally controlled**. Models that depend on centralized APIs, surveillance-driven business models, or proprietary platforms are fundamentally incompatible with digital sovereignty. But when models run locally, inside clearly defined boundaries, they can dramatically lower the barrier to using complex systems.


In the short term, we're exploring LLMs as an interface layer. One concrete experiment is controlling parts of the Clan UI and services through a locally hosted LLM. Instead of requiring users to learn new terminology or configuration patterns upfront, they can describe what they want in plain language and have the system translate that intent into concrete, inspectable actions. 

{{< video key="clan-client-prototype-compress" controls="true" >}}

Used this way, LLMs don't replace understanding, but help people to get started without being overwhelmed. A second already planned experiment is the use of LLMs within Spaces: locally hosted LLMs could also help facilitate interaction by acting as shared assistants that summarize activity, mediate coordination, surface relevant context, or help people navigate what is happening inside a space without turning it into a noisy or overwhelming environment.


Long-term, we see a more interesting possibility. If Clan becomes the foundation for sovereign, self-hosted computing, then locally hosted and isolated LLMs could act as mediators between Clans. A Clan could describe the services it offers, the resources it is willing to share, or the conditions under which access is granted. 


These descriptions could be indexed, queried, and negotiated through LLMs, enabling discovery and coordination without relying on centralized platforms. This direction is inspired by projects such as [KOI](https://metagov.org/projects/koi-pond/project-details) and aligns closely with our vision of a decentralized, human-scale internet.


In both cases, the principle remains the same: keeping LLMs local, inspectable, and isolated, we can use their strengths without importing the failures of the platforms that currently dominate this space.

### ClanHub: A Home for Community Services

As Clan has grown, so has the number of services built on top of it. What started as a small, tightly integrated set of core services has expanded to dozens of modules, many of which don't require deep coupling with Clan's core logic. While this growth is exciting, it also creates maintenance overhead that slows down core development. 


To address this, we're introducing ClanHub: a shared home for open source services compatible with Clan that are developed and maintained by the wider community.


ClanHub is intended as a place where contributors can add new services, iterate quickly, and establish best practices together, while relying on stable Clan core APIs. This allows the core team to focus on fundamentals like reliability, networking, and tooling, while giving community services more room to grow on their own terms.


A great example of a contribution that fits naturally into ClanHub is monitoring. Recently, [Friedow contributed a new monitoring service](https://git.clan.lol/clan/clan-core/pulls/5999) that cleanly separates server and client roles, supports metrics, logs, dashboards, and alerting, and has already been tested in real-world Clan setups. This kind of well-scoped, production-proven service benefits from shared CI, clear ownership, and faster iteration, all of which ClanHub is designed to support.


Over time, we plan to move many services that don't require tight core integration into the community space, while keeping only a small, carefully curated set in Clan itself. ClanHub will provide shared CI, testing patterns, documentation, and visibility, making it easier to review contributions, ensure quality, and help new maintainers succeed.


Most importantly, ClanHub is optional. No one is forced to use it, and nothing prevents experimentation elsewhere. But for contributors who want their services to be discoverable, well-supported, and compatible with Clan's evolving ecosystem, ClanHub will be the natural place to collaborate.


This is an important step toward a healthier division of responsibilities: a stable, focused core and a thriving, fast-moving ecosystem around it.

### Clan as mass-scale decentralized infrastructure

Although we've so far focused on smaller scale networks, we have also been researching how Clan might add resilience and value to large-scale decentralized systems such as blockchains. Blockchains, which store more than $3 trillion worth of digital assets in the form of cryptocurrencies, are heavily dependent on centralized infrastructure such as cloud providers and hosted platforms. Now that we have a stable version of Clan, we can finally say to the crypto world:  "Nix can fix this."

We believe this area is worth exploring because it represents a strategic opportunity and proving ground for both Nix and Clan. It's a highly adversarial environment, so if Clan can endure there, it can endure anywhere. Moreover, most blockchain infrastructure is already open source and Linux-based, so migration costs would be low, but the potential benefits are high. 

Blockchain decentralization is undermined at several layers:

* **Infrastructure:** deploying and maintaining [nodes](https://www.coinbase.com/en-de/learn/crypto-glossary/what-is-a-node-in-cryptocurrency) is a technical burden that most individuals are unable or unwilling to take on. Nodes instead tend to consolidate around resource-rich enterprises who average users depend on, share private data with, and even pay for access.
* **Applications:** very little usable information can be stored or communicated over a blockchain.  The vast majority of user experience and activity happens off-chain, where [DApp](https://en.wikipedia.org/wiki/Decentralized_application) developers have to bridge the gap with hosted interfaces or outsource to third-party platforms like [Discord](https://discord.com/). This creates friction, restricts what DApps can do, and burdens maintainers with unnecessary liabilities.
* **Stack depth:** the core functionality of a blockchain is to sort transactions and maintain shared global states. It's actually a very shallow stack, with the ordered logic of the protocol fundamentally disconnected from the chaotic system of human society. 

We have considered a number of ways Clan could be used at each of these layers, including:

* **Communal hosting:** not all users need to run their infrastructure personally. Friends, families, and communities can create Clans to collectivize node resources. Useful configurations could then propagate between groups.
* **[DAO](https://ethereum.org/en/dao/) desktop:** like showing up on the first day of work and being given a preconfigured laptop, DAO members could simply open a DAO-managed Clan to enter into a local, bespoke desktop environment, where things like privacy could be mandatory.
* **Off-chain smart contracts:** instead of relying on application-specific [L2s](https://help.coinbase.com/en/coinbase/getting-started/crypto-education/glossary/layer-2), individuals could simply deploy ephemeral, user-specific private L2s for their personal transactions, executed securely over a Clan with verifiable end states.


# Closing Thoughts

The examples discussed above, including blockchain and peer-to-peer coordination, are just one illustration of a broader pattern: many long-standing problems across different industries stem from the same underlying issues of centralization, opacity, and loss of user control. We see Clan as a foundation that can help address these issues far beyond any single domain, and we hope this post sparks curiosity and creativity about where Clan could be useful next, or what could be built on top of it.

2025 marked an important transition for Clan: from experimentation toward production-grade infrastructure. With the first stable release, stronger defaults, and a growing focus on reliability, we've taken on a greater responsibility toward the people and communities who depend on this work. Over the past year, we also deepened our involvement in the Nix ecosystem, through community events, sponsorships, and direct contributions, including [Lassulus](https://github.com/lassulus) taking on the role of treasurer of the [Nix Foundation](https://nixos.org/community/teams/foundation-board/). These are signals of long-term commitment, not just to Clan, but to the ecosystem it builds upon.

We are deeply grateful to everyone who contributed code, feedback, ideas, and critical perspectives throughout the year, as well as to our partners and sponsors, especially our friends at [Golem](https://golem.network/), whose support has been instrumental in making this work possible.

Clan is built in public, deliberately and collaboratively. If you're curious, we invite you to try [Clan](https://docs.clan.lol/main/), explore the [repository](https://git.clan.lol/clan/clan-core), join the conversation on [Matrix](https://matrix.to/#/#clan:clan.lol) , give feedback, follow development, and share ideas about where Clan could help solve real problems. We believe sovereign computing is not a niche concern, but a prerequisite for a healthier digital future, and we're excited to keep building toward it together .

