{
  perSystem =
    {
      lib,
      pkgs,
      self',
      ...
    }:
    let
      deployScript = pkgs.writeShellScript "deploy.sh" ''
        export PATH="${
          lib.makeBinPath [
            pkgs.coreutils
            pkgs.openssh
            pkgs.rsync
          ]
        }"
        set -euo pipefail
        tmpdir=$(mktemp -d)
        trap "rm -rf $tmpdir" EXIT

        if [ -n "$SSH_HOMEPAGE_KEY" ]; then
          echo "$SSH_HOMEPAGE_KEY" > "$tmpdir/ssh_key"
          chmod 600 "$tmpdir/ssh_key"
          sshExtraArgs="-i $tmpdir/ssh_key"
        else
          sshExtraArgs=
        fi

        cd ${self'.packages.default}
        rsync \
          --delete \
          --checksum \
          -e "ssh -o StrictHostKeyChecking=no $sshExtraArgs" \
          -a ./ \
          www@clan.lol:/var/www/clan.lol
      '';
    in
    {
      apps.deploy.program = "${deployScript}";
    };
}
