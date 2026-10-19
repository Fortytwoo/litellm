# Chinese dashboard deployment

This branch ports BerriAI/litellm#30499 onto the v1.106.0 release, commit 955bdaafa8b72b2b6ff728048f272fbc06049f63. The five contributor commits are retained as cherry-picks, with current dashboard components kept where the older components were replaced upstream. The accidental root-level src directory in the PR is removed

The language context uses the current shadcn components, without reintroducing the removed Ant Design dependency. Chinese is the default, and the header switches between Chinese and English. The stored language affects interface text and date presentation. Request bodies, responses, model identifiers, credentials and API field names retain their original values

Run npm ci and npm run build in ui/litellm-dashboard. Build the deployment image from the repository root with docker build -f deploy/zh-cn/Dockerfile --build-arg REVISION=$(git rev-parse HEAD) -t litellm:1.106.0-zh-cn . The image replaces only the dashboard export on the pinned backend image. Python packages and database schema are unchanged

Keep the existing proxy configuration and secrets outside this repository. Set general_settings.disable_env_credential_login to true after confirming a database proxy_admin account can log in with its individual password. Remove UI_USERNAME and UI_PASSWORD from the runtime environment. This disables shared environment credentials and master-key form login, while leaving database-account login and authenticated API access available

First run the image on a loopback preview port with the same backend version. Check individual account logins, admin access, member isolation, the readiness warning flag and rejection of old environment credentials. Back up configuration, environment and image references before switching the production gateway. The SSO adapter should serve this dashboard directly, with the previous compiled-text localization override removed

Focused verification covers translation key parity and interpolation, switching languages without losing draft input or conversation content, persistence, pagination, dates, token counts and environment-login warning visibility. Browser verification covers all exported route entries and representative tabs and creation forms, including Chat and Lens. Preserve the previous image and restricted configuration backup for rollback

Run `node scripts/audit-i18n.cjs report.json --check` in `ui/litellm-dashboard` to reject missing translations, placeholder mismatches, untranslated display candidates and stale exceptions. Each retained source exception is scoped to an exact file, display scope and text. See [I18N_STATUS.md](I18N_STATUS.md) for coverage and verification boundaries
