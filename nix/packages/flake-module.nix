{ self, ... }:
{
  perSystem =
    {
      pkgs,
      self',
      ...
    }:
    {
      packages.default = self'.packages.website;
      packages.website = pkgs.stdenv.mkDerivation {
        name = "website";
        src = self;
        nativeBuildInputs = [
          pkgs.importNpmLock.npmConfigHook
          pkgs.nodejs
          pkgs.hugo
        ];
        buildPhase = ''
          runHook preBuild
          # update generate css file
          npx tailwindcss -i assets/css/main-input.css -o assets/css/main.css
          hugo
          runHook postBuild
        '';
        npmDeps = pkgs.importNpmLock {
          npmRoot = self;
        };
        installPhase = ''
          runHook preInstall
          cp -r ./public $out
          runHook postInstall
        '';
      };
    };
}
