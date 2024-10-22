{
  perSystem =
    {
      pkgs,
      ...
    }:
    {

      devShells.default = pkgs.mkShellNoCC {
        buildInputs = [
          pkgs.importNpmLock.hooks.linkNodeModulesHook
          pkgs.hugo
        ];
        npmDeps = pkgs.importNpmLock.buildNodeModules {
          npmRoot = ../..;
          inherit (pkgs) nodejs;
        };
      };
    };
}
