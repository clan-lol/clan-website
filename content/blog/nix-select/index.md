+++
title= "nix-select"
subline= "a pure and lazy query language in nix"
date= 2025-02-17T00:08:10+02:00
author= "Lassulus"
tags = ['Info']
+++

Find it at: https://git.clan.lol/clan/select

Do you find that accessing values from lists feels cumbersome? `builtins.elemAt` getting you down? What about filtering nested dictionaries for specific keys?

For this reason we hacked together an unmatched selecting experience. It is written in pure Nix without dependencies to make your life 100% more selectful.

To use `nix-select` with the the `clan` CLI just run `clan select`.

Prominent features include:
- globs `*`
- `{a,b}`
- `.0` index based accessing

Example using the clan CLI:

```sh
clan select 'nixosConfigurations.*.config.clan.core.vars.generators.*.files.*.{path,secret}'
```

This will print all variables defined in your clan.

Here's the equivalent non-selectful expression:

```nix
builtins.mapAttrs (
  _: v0:
  builtins.mapAttrs (
    _: v1:
    (builtins.mapAttrs (
      _: v3:
      builtins.intersectAttrs {
        path = { };
        secret = { };
      } v3
    ) v1.files)
  ) v0.config.clan.core.vars.generators
) nixosConfigurations
```

`clan select` also uses a transparent caching technique, so running that command again will return significantly faster.

There are a lot more operators and constructs supported in `nix-select`, which are documented in the [README](https://git.clan.lol/clan/select).

## Usage without Clan

You can also just import our 100% pure Nix library and use it directly in your project today!

To use it inside any `nix repl`:

```nix
nix-repl> select = (builtins.getFlake "github:clan-lol/select").lib.select
```

With this, the `select` function can be used by just passing it a query string and an
attribute set or list:

```nix
nix-repl> select "*.config.networking.hostName" nixosConfigurations
```

The query language is intentionally designed to be compatible with the nix grammar, so it might possible to extend the nix expression language to improve the ease of use.
