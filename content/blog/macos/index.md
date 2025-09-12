+++
title = "Clan + macOS"
subline = "Clan can now manage macOS machines"
date = 2025-09-09T16:44:44+02:00
draft = false
author = "Michael Hoang"
tags = ['Dev Report']
+++

Over the last year, we've been progressively adding macOS support to Clan. This began with sticking a M4 Mac mini in a basement to run all of our builds and test suite. In the beginning, we couldn't manage this Mac using Clan so we created a repo separate to `clan-infra` and used nix-darwin directly to configure the machine.

After a while, we started to notice that the GUI and CLI would periodically stop working on macOS as breaking changes would accumulate as the majority of the team runs Linux. So we decided that it was time to actually put the Mac mini to work by configuring it to build the GUI, CLI and all the tests on every PR to ensure they work on macOS as well.

At this point, the CLI ran and worked well on macOS allowing you to deploy to NixOS machines using the `clan machines install` and `clan machines update` commands.

However, we wanted macOS machines to be first-class Clan members, with software, settings, and secrets managed declaratively like Linux, so we began adding nix-darwin support to Clan.

## What is nix-darwin

[nix-darwin](https://github.com/nix-darwin/nix-darwin) is a framework that uses the module system from NixOS to manage macOS, allowing you to bring the reproducibility and declarative power of Nix to macOS.

Clan automatically imports a core set of modules into all machines to provide features like remote deployment and vars. These modules were written specifically for NixOS, but are necessary to make Clan useful on macOS and other systems so we needed to extend them.

## multi-OS modules

The NixOS module system has been made into a library and is now used in nix-darwin, Home Manager and other Nix-based projects. To keep a module from being loaded by the wrong module system, authors should set the `_class` attribute to `nixos` or `darwin`.

We could extend the core Clan modules to support macOS by duplicating all the code for nix-darwin, however this would lead to a lot of extra maintainence burden. So instead we decided to make modules that support both NixOS and nix-darwin.

Previously, detecting which module system you were in required hacks like `options ? virtualisation` which works due to the `virtualisation` option tree existing only in NixOS and not nix-darwin:

```nix
{ options, config, lib, ... }:
{
  config = lib.optionalAttrs (options ? virtualisation) {
    # NixOS specific configuration
  };
}
```

This hack does not work inside of `imports` meaning you are not able to do conditional imports:

```nix
{ options, config, lib, ... }:
let
  nixosModule = { ... }: {
    # NixOS specific configuration
  };
  darwinModule = { ... }: {
    # nix-darwin specific configuration
  };
in {
  imports = [
    (lib.optionalAttrs (options ? virtualisation) nixosModule)
    (lib.optionalAttrs (options ? launchd) darwinModule)
  ];

  config = {
    # shared configuration
  };
}
```

This led to me making my first ever PR to improve the module system, which added `_class` to the module arguments allowing conditional imports based on the module system class:

```nix
{ _class, options, config, lib, ... }:
let
  nixosModule = { ... }: {
    # NixOS specific configuration
  };
  darwinModule = { ... }: {
    # nix-darwin specific configuration
  };
in {
  imports = [
    (lib.optionalAttrs (_class == "nixos") nixosModule)
    (lib.optionalAttrs (_class == "darwin") darwinModule)
  ];

  config = {
    # shared configuration
  };
}
```

This means you can now write modules that support multiple module systems without needing to rely on hacks.

Using this new feature, we have added vars and deployment support to nix-darwin machines managed by Clan.

If you'd like to try it out, you can check out our [macOS guide](https://docs.clan.lol/guides/macos/).
