{
  description = "Website of the clan project";

  inputs = {
    nixpkgs.url = "git+https://github.com/NixOS/nixpkgs?ref=nixpkgs-unstable&shallow=1";
    flake-parts.url = "github:hercules-ci/flake-parts";
    flake-parts.inputs.nixpkgs-lib.follows = "nixpkgs";

    # Hugo 0.153.0 replaced the CGO-based WebP encoder with a WASM build
    # (Wazero + libwebp 1.6.0) that has a hard 384 MiB memory cap, causing
    # OUT_OF_MEMORY on every WebPEncode call.  Pin to the last nixpkgs
    # revision carrying Hugo 0.152.2 until upstream resolves this:
    # https://github.com/gohugoio/hugo/issues/14282
    nixpkgs-hugo.url = "github:NixOS/nixpkgs/c0b0e0fddf73fd517c3471e546c0df87a42d53f4";

    treefmt-nix.url = "github:numtide/treefmt-nix";
    treefmt-nix.inputs.nixpkgs.follows = "nixpkgs";

    process-compose.url = "github:Platonic-Systems/process-compose-flake";
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
        "x86_64-darwin"
      ];
      imports = [
        ./nix/treefmt/flake-module.nix
        ./nix/devShells/flake-module.nix
        ./nix/packages/flake-module.nix
        ./nix/apps/flake-module.nix
      ];
      perSystem =
        {
          lib,
          self',
          system,
          ...
        }:
        {
          _module.args.pkgs = import inputs.nixpkgs {
            inherit system;
            overlays = [
              (_final: _prev: {
                hugo = inputs.nixpkgs-hugo.legacyPackages.${system}.hugo;
              })
            ];
          };

          checks =
            let
              packages = lib.mapAttrs' (n: lib.nameValuePair "package-${n}") self'.packages;
              devShells = lib.mapAttrs' (n: lib.nameValuePair "devShell-${n}") self'.devShells;
            in
            packages // devShells;
        };
    };
}
