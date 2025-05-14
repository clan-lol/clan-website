{ inputs, ... }:
{
  imports = [
    inputs.process-compose.flakeModule
  ];

  perSystem =
    {
      pkgs,
      ...
    }:
    {

      process-compose.dev = {
        settings.processes = {
          css = {
            # we have to wrap the command with unbuffer as it expects a tty otherwise it stops immediately
            # see https://github.com/F1bonacc1/process-compose/issues/64
            command = "unbuffer tailwindcss -i assets/css/main-input.css -o assets/css/main.css --watch";
            # wait for first build
            ready_log_line = "Done in";
          };
          hugo = {
            command = "hugo server -D -F";
            # wait for first build of css before starting
            depends_on.css.condition = "process_log_ready";
          };

        };
      };

      devShells.default = pkgs.mkShellNoCC {
        nativeBuildInputs = with pkgs; [
          importNpmLock.hooks.linkNodeModulesHook
          hugo
          nodePackages.npm
          expect
        ];
        npmDeps = pkgs.importNpmLock.buildNodeModules {
          npmRoot = ../..;
          inherit (pkgs) nodejs;
        };
      };
    };
}
