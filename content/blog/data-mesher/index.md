+++
title = "Data Mesher"
subline = "Runtime state for Clan"
date = 2026-03-30T12:00:00+00:00
draft = false
author = "Brian McGee"
tags = ['Dev Report']
+++

[NixOS] is great when it comes to _declarative state_. 
Instead of running commands to install packages, edit config files and so on, you declare what you want and `nixos-rebuild switch` takes care of the rest.

Clan takes this one step further, making it easy to define services which span multiple machines and ensuring the end result by running `clan machines update`.

So, what if we want to update a user's `authorized_keys` across a 10, 20 or 30-machine Clan? 

As you might have guessed, we first update our Clan config and then run `clan machines update`. 
This will build and deploy the new NixOS configuration across all 30 machines.

Feels a little heavy though, doesn’t it? 
Maybe we just wanted to give that person access for a short while? 
When we’re finished, we have to update our Clan config and __redeploy to every machine in our Clan__.

And what if a few of those machines are laptops, used in the field and possibly out of contact or turned off when we are ready to roll back that `authorized_keys` change? 
Unless you remember to deploy those machines when they come back online, they will remain out of sync and continue to allow access until the next deployment.

That’s why we are building [Data Mesher].

## How does it work?

Sign a file, give it to Data Mesher, and it will (eventually) replicate it to every other Data Mesher instance. 
If a node is offline when the update is received, that isn’t a problem. The next time it connects to the cluster, it will catch up.

There’s no [RAFT] here. 
We don’t require a quorum when accepting writes. 

Networking is handled by [libp2p], and we use a basic anti-entropy mechanism inspired by [memberlist] to distribute an index of file signatures. 
It’s definitely more verbose than it needs to be just now, but we are _tentatively_ adding complexity as we go along.

And you can’t just put any old file into Data Mesher. 
We require some configuration ahead of time, detailing each file name and a list of valid signers.

```toml
[files]
"config.json" = [
    # Base64 encoded ED25519 public keys
    "P6AE0lukf9/qmVglYrGPNYo5ZnpFrnqLeAzlCZF0lTk="
]
"data.bin" = [
    # Base64 encoded ED25519 public keys
    "ZasdhiAVJTa5b2qG8ynWvdHqALUxC6Eg8pdn6RVXuQE=",
    "1ru2QQ1eWV7yDlyfTTDEml3xTiacASYn0KprzknN8Pc="
]
```

This allows us to offload responsibility for managing the signature timestamp. 
If the signature is valid and the timestamp is later than the node's current timestamp, it is _accepted as the latest version and distributed accordingly_. 

No more blessed nodes to ensure consistent timekeeping, as we had in V1 (yes, we’re already on V2). It's up to the signers to ensure timestamps make sense.

One last thing: __no files over 10MiB__. 
We aren’t building [Syncthing] or [IPFS]. 
Data Mesher is intended for targeted, small amounts of runtime state that need to be deployed resiliently within a reasonable time frame.

## What can it be used for?

We are still fleshing that out, but so far we have [dm-dns], a distributed DNS system which leverages [Service Exports] to collect all the custom endpoints that a Clan wants to expose internally. 
A zone file is then generated and injected into Data Mesher. 
From there, systemd is configured to watch for changes to that zone file as they land in the local file system and reloads an instance of [unbound].

Other experiments include [dm-pull-deploy], an asynchronous deployment system which distributes flake references via Data Mesher.
Machines automatically run `nixos-rebuild` when a new flake reference arrives.

Most recently, [Pinpox] hooked up an instance of [OpenCrow] (his own version of [OpenClaw]) to Data Mesher, which let him change the wallpaper on his machines by chatting with the agent over [Matrix]. 
This experiment was tightly scoped, for _good reason_. 

{{< video key="opencrow" controls="true" muted="true" >}}

But technically, there’s not much difference between changing a wallpaper and granting the agent access to the async deployment system, which would let it manage much more than just the wallpaper...

## What’s Next?

Data Mesher is still experimental and will continue to evolve as we flesh out the various use cases.

In the short term, we are working on [signed namespaces](https://git.clan.lol/clan/data-mesher/pulls/310) so we don’t have to specify every file ahead of time. 
This will allow machines, for example, to publish self-signed information about themselves, such as their system closure, disk usage, and other basic metrics.

Long-term, we need to see how much mileage we can get out of this file-based API. 
Perhaps not everything will work well within this model. Or maybe the Linux kernel is on to something 🤷.

We also encourage you, the user, to try it out and see what you can come up with, and be sure to drop anything interesting into the [clan-community] repository 🙏.

[NixOS]: https://nixos.org
[Data Mesher]: https://git.clan.lol/clan/data-mesher
[clan-community]: https://git.clan.lol/clan/clan-community
[RAFT]: https://raft.github.io/
[libp2p]: http://libp2p.io/
[Syncthing]: https://syncthing.net/
[IPFS]: https://ipfs.io/
[dm-dns]: https://git.clan.lol/clan/clan-core/src/branch/main/clanServices/dm-dns
[Service Exports]: https://clan.lol/docs/25.11/guides/services/exports
[Pinpox]: https://github.com/pinpox
[OpenCrow]: https://github.com/pinpox/opencrow
[OpenClaw]: https://github.com/openclaw
[Matrix]: https://matrix.org/
[memberlist]: https://github.com/hashicorp/memberlist
[dm-pull-deploy]: https://git.clan.lol/clan/clan-community/src/branch/main/services/dm-pull-deploy
[systemd]: https://systemd.io/
[unbound]: https://www.nlnetlabs.nl/projects/unbound/about/