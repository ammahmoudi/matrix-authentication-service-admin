# Releasing MAS Admin

This file is for maintainers.

## Versioning

Use Semantic Versioning: `MAJOR.MINOR.PATCH`.

- App version: `package.json` and `package-lock.json`
- Git tag: `vX.Y.Z`
- Docker tags:
  - `amahmoudi/mas-admin:X.Y.Z`
  - `amahmoudi/mas-admin:X.Y`
  - `amahmoudi/mas-admin:X`
  - `amahmoudi/mas-admin:latest`

## Release steps

```bash
# 1) bump version (without auto-tag)
npm version patch --no-git-tag-version

# 2) commit and tag
git add package.json package-lock.json
git commit -m "chore(release): vX.Y.Z"
git tag -a vX.Y.Z -m "MAS Admin vX.Y.Z"
git push origin master
git push origin vX.Y.Z

# 3) build and publish docker tags
docker build -t amahmoudi/mas-admin:X.Y.Z .
docker tag amahmoudi/mas-admin:X.Y.Z amahmoudi/mas-admin:X.Y
docker tag amahmoudi/mas-admin:X.Y.Z amahmoudi/mas-admin:X
docker tag amahmoudi/mas-admin:X.Y.Z amahmoudi/mas-admin:latest
docker push amahmoudi/mas-admin:X.Y.Z
docker push amahmoudi/mas-admin:X.Y
docker push amahmoudi/mas-admin:X
docker push amahmoudi/mas-admin:latest
```
