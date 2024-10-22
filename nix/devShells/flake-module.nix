{
  perSystem =
    {
      pkgs,
      ...
    }:
    {

      devShells.default = pkgs.mkShellNoCC {
        nativeBuildInputs = [
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
