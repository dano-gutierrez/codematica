# Artifact validation

`npm run test:production:smoke` takes the existing `apps/web/.next` build into a fresh temporary directory, runs a production-only dependency install, verifies dependency resolution and checks HTTP readiness plus public/admin shells, the notebook catalog and existing writing routes. It never prunes the workspace, reads service credentials or executes editorial jobs. Temporary install/runtime logs are retained and their path is printed. Run after `npm run build` and before claiming production runtime readiness.

The web app declares `@codematica/ui` as a direct production dependency. The smoke verifies that its React-only `notebook-session` subpath resolves in the clean install.

The artifact also rejects privileged editorial worker RPC/service-key markers in built server/client JavaScript, protecting the HTTP/worker import boundary. CI uploads production install/startup logs independently of unit results.
