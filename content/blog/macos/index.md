+++
title= "Introducing macOS support"
subline= "Clan can now deploy nix-darwin configurations"
date = 2025-06-11T09:08:10+02:00
draft = false
author = "Jörg Thalheim"
tags = ['Dev Report']
+++

We have supported using the clan-cli on macOS for a while for tasks like installing and updating NixOS machines.
Now we also support updating your macOS machines with [nix-darwin](https://github.com/nix-darwin/nix-darwin).

This means we can now do `clan machines update somemac` to update the configuration remotely via SSH.
We do not yet support all features that we support on NixOS, but we already support [vars](https://docs.clan.lol/guides/vars-backend/).

Check out our [documentation](https://docs.clan.lol/guides/macos/) on how to use clan with macOS.
