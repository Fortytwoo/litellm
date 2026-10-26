# User names in request and audit logs

The deployment candidate preserves the production UI baseline `5aa0e963bca9290b21809e92315eb96b00a284f2` and adds feature `6dbbca7ffa675469a33d71561787b42bc36dc292`. The combined source revision is `c2e70f49d1e32ce426bdff13c04ccd8757183f9f`, on `litellm_user_names_release_20261026`

Request logs, audit actors and audited user objects prefer the existing real-name alias, then email, then ID. IDs and original audit records remain available for traceability. Singleton lookup uses `/v2/user/info` because `/user/list` treats one ID as a substring filter and can return a derived technical account before the exact user

The user authorized deployment but retained control of service restarts. Preparation did not stop, restart or replace any running service. The candidate is not active yet

## Candidate

The candidate extends the exact running gateway image `sha256:95c4a25a675d900d978f53ae0e8f451571e1559bab5ee0189982bcf80eca47e9`, retaining its runtime, authorization, account bindings, request cache, currency handling, dependencies and process configuration

Candidate image: `managed-gateway-e2e:user-names-c2e70f49d1-20261026`, immutable ID `sha256:e2650685fbaa793dc4cfa8a563f8f8fbb8f19610b6360f022a8df9ef424a971a`

New static root: `/app/e2e/ui-user-names-c2e70f49d1`. The previous static root remains in the image, and its hashed assets are also retained in the new root so existing browser tabs can finish loading old chunks

Release directory on `ds-lan`: `/mnt/BaseService/mediec-ai-gateway-e2e/releases/user-names-c2e70f49d1-20261026`

The directory contains the immutable UI archive, manifest, Dockerfile, offline verifier, preparation receipt, candidate Compose overlay and manual activation script. `release.tar.gz` SHA-256 is `877e3ef807ca66ddf70ba648eaf231cc4f45721cd414a1106cf7f1b686fdc6b9`

Restricted backups of all seven live Compose files, container inspection and the previous UI are in `private/`. Private configuration and credentials are not committed

## Verification

The combined source passed 123 focused tests and `NEXT_PUBLIC_MANAGED_GATEWAY=1 npm run build`, exporting all 67 pages, including gateway management and request cache pages. Production TypeScript, changed-file ESLint error checks and formatting passed. The existing AVIF optimization warning remains

On the deployment host, the candidate ran offline under its existing non-root UID 999, with no network or production state mounts and a read-only root filesystem. All 853 new UI hashes, 413 running source/resource hashes and 347 previous static hashes matched. Managed pages and their CSP passed direct static-adapter checks

The resolved Compose comparison allows only the gateway image and `MCP_CONSOLE_REACT_ROOT` to change. It preserves all seven actual production overrides. All 133 existing container identities, images, start times and restart counts remained unchanged during preparation

The read-only activation preflight passed with maintenance disabled and model inference inflight zero. Real-account UI display after activation remains unverified. No model inference, credential update or production database write was performed for deployment preparation

## User activation

Run the following when ready to recreate the gateway

```powershell
ssh ds-lan 'python3 /mnt/BaseService/mediec-ai-gateway-e2e/releases/user-names-c2e70f49d1-20261026/activate.py'
```

The script verifies the running image and original Compose hashes, closes new model inference through the existing maintenance flag, and waits for model inference inflight to reach zero. It requests natural gateway shutdown with `docker stop --time=-1`, then starts only `gateway` with the full original Compose chain plus the candidate overlay. It does not force-kill active connections. Natural shutdown may wait for other open gateway connections

The script verifies the candidate image, health and static root before reopening inference. A failed activation attempts to restore the previous image. A failed restoration leaves maintenance closed for inspection. It does not rebuild or restart LiteLLM, PostgreSQL, Redis, FRP or the source MCP services

Use this script rather than a plain `docker restart` or the older three-file `start-business.sh`, which does not include all current production overrides

After activation, refresh the authenticated browser and verify the real user name in request logs and audit list/detail, while retaining the original ID and unchanged audit JSON. Readiness and file hashes alone do not establish that browser acceptance

## Read-only preflight and rollback

```powershell
ssh ds-lan 'python3 /mnt/BaseService/mediec-ai-gateway-e2e/releases/user-names-c2e70f49d1-20261026/activate.py --check'
```

To restore the previous gateway image after activation, the user can run

```powershell
ssh ds-lan 'python3 /mnt/BaseService/mediec-ai-gateway-e2e/releases/user-names-c2e70f49d1-20261026/activate.py --rollback'
```

Rollback uses the same drain and natural-shutdown process. It restores the original image and static root without restoring or rewriting any database
