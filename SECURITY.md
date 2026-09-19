# Security

## Reporting a vulnerability

Please do not open a public GitHub issue for a suspected security vulnerability.

Report security concerns privately to the repository maintainers through the GitHub repository's available private contact or security-reporting mechanism.

Include:
- a clear description of the issue;
- affected files or components;
- steps to reproduce where appropriate;
- the potential impact;
- any suggested mitigation.

## Repository safety

Ottimo is currently a local/demo application and should not contain production credentials, private customer data, API keys, access tokens, or other secrets.

Demo organisations, URLs, contact details, audit results and screenshots must be fictional or explicitly public.

Before publishing a deployment or repository:
1. review the current working tree;
2. search for secrets and credentials;
3. verify environment files are ignored;
4. verify demo data is fictional;
5. verify no private customer or third-party data is committed;
6. run the test, lint and production build checks.

If a secret is ever committed, treat it as compromised and rotate/revoke it even if the file is later deleted.
