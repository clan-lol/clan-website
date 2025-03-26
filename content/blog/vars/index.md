+++
title = "Vars"
subline = "A framework for managing secrets and computed values"
date = 2025-03-24T21:25:04+07:00
draft = false
author = "DavHau"
tags = ['Dev Report']
+++


## The problem
Deploying NixOS machines is often not a one-click experience. Even when re-using existing NixOS configurations, there is usually some machine specific initialization overhead that needs to be dealt with manually. Machine IDs need to be generated, passwords set, and ssh key pairs generated, to name a few examples.  

None of that is very satisfying as an admin, and it is definitely a problem for clan, where our goal is to enable non-technical people to administer NixOS machines by automating away as much as possible.  

## The current state 

Let's go through the options a NixOS admin currently has.

If secrets are entered or generated on the target machine directly, they become part of its state which means they are either gonna be lost upon re-deployment to new hardware, likely messing up authentication between hosts, or they need to be backed up and restored carefully. Both resembles overhead.  

To circumvent that problem, as of now, admins would use tools like sops-nix or agenix to store  and re-deploy secrets securely. But even this introduces manual initialization overhead, as secrets need to be generated manually, then copy and pasted between tools.

No matter which of the above strategies is used, admins cannot simply enable a NixOS module that requires a secret without manual interaction. How a secret needs to be generated exactly, is not part of the NixOS module's definition, so it cannot possibly be automated as of now.

## The journey 

We wanted to solve this problem, which is why we developed a NixOS based framework for secrets and other computed values, that allows module maintainers to declare how such values need to be generated, instead of offloading that work to the admins.

We have iterated on our solution several times already, going from imperative tooling, through our first module system based approach called `facts`, to our current solution which we call `vars` as in 'variables'.

During this journey we hit a lot of road bumps and learned quite a few things on what is needed to generate, store, manage and share secrets between machines seamlessly.

The clan developers as well as some power users of our community have been using this framework already for several months now. While we are still working on some improvements, we think it is ready to be shared and tested more extensively by the community

## Core Concepts of `vars`

Before we jump into examples, here an overview about our core concepts

**Secret/Public**:  
Some generated values need to be stored encrypted, like for example ssh private keys, while others should be world readable, like public keys.

**Generators**:  
`Vars` (either secret or public) are computed by generators. Generators are scripts which take some input and produce files.

**Stores**:  
Similar to how nix derivations produce files which are stored in the nix store, `vars` generators produce files which are either stored in a public or secret store. A generic store interface allows swapping out the store. For example, users can choose to store their secrets either in sops-nix or password-store, or even bring their own store.

**Prompts**:  
Some secrets require input from the user before they can be generated. If, for example, a password hash needs to be generated, the user has to enter the password first. As everything else, prompts are declarative, and different frontends, like CLIs or GUIs can be built in order to prompt the user.

**Sharing**:  
Some `vars` need to be shared between machines. An admin might choose, for example, to re-use their github api key across several machines, instead of generating a new one for each. If the key changes, it should be changed on all machines simultaneously.

**Dependencies**:  
`Vars` can depend on each other, as in if one secret changes, others have to be updated as well, one simple example being a public key, that is derived from a private key. The dependency system ensures that secrets across the fleet remain in sync and also allows re-rolling the secrets easily without having to worry about forgetting to update something.

## Example

In this example, a `vars` generator is used to:

- prompt the user for the password
- run the required `mkpasswd` command to generate the hash
- store the hash in a file
- set `users.users.root.hashedPasswordFile` to reference that file


```nix
{config, pkgs, ...}:
let
  vars = clan.core.vars;
in
{
  # The vars definition
  clan.core.vars.generators.root-password = {
    # Prompts the user for a password
    # (`password-input` being an arbitrary name)
    prompts.password-input.description = "the root user's password";
    prompts.password-input.type = "hidden";
    # Defines an output file for storing the hash and declare it as non-secret
    files.password-hash.secret = false;
    # Defines the logic for generating the hash
    script = ''
      cat $prompts/password-input | mkpasswd -m sha-512 > $out/password-hash
    '';
    # Tools required by the script
    runtimeInputs = [ pkgs.mkpasswd ];
  };

  # Sets the root password to the file containing the hash
  users.users.root.hashedPasswordFile =
    # Clan will make sure, this path exists at runtime
    vars.generators.root-password.files.password-hash.path;
  # Users need to be immutable, otherwise updating a password might be ignored
  users.mutableUsers = false;
}
```

As one can see, the `vars` generators definition is part of the normal NixOS configuration.

In this NixOS module, the root user's `hashedPasswordFile` is set to a, yet to be created path which will contain the generated password hash.

A wrapper around `nixos-rebuild switch` ensures that this path will be created before the machine is deployed.

### More Examples

To find more examples, just take a look at the [existing clan modules](https://git.clan.lol/clan/clan-core/src/branch/main/clanModules) of which several are using `vars` already, for example the [sshd module](https://git.clan.lol/clan/clan-core/src/commit/828eff528a5d3e996bf15a42a91e7712f6202bbe/clanModules/sshd/shared.nix) which sets up a certificate authority to certify ssh host keys across all machines. Never have ssh based scripts stuck again because of having to type in `yes` to trust the host.

## Future work

### Service oriented design

As seen in the example above, `vars` are currently defined inside a machine's NixOS configuration. While this design choice is nice in terms of compatibility, some interactions become more complex, like defining global `vars` across all machines. In the worst case, several machines would have to be evaluated in order to update `vars` reliably across the infrastructure.

We want to add `vars` support to the clan inventory which improves the UX and performance to manage infrastructure overarching settings.

### Upstreaming the framework

We believe `vars` can be quite beneficial for any NixOS user and therefore want to upstream as much of it as possible. In fact, a first [draft PR](https://github.com/NixOS/nixpkgs/pull/370444) has been opened by @lassulus a while ago. 
