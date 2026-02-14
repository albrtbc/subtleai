## [1.2.1](https://github.com/albrtbc/subtleai/compare/v1.2.0...v1.2.1) (2026-02-14)


### Bug Fixes

* stream NDJSON response incrementally and restore headers timeout ([088d5d1](https://github.com/albrtbc/subtleai/commit/088d5d1440e98941edfc2b9208a974189003bbd2))

# [1.2.0](https://github.com/albrtbc/subtleai/compare/v1.1.2...v1.2.0) (2026-02-14)


### Features

* add upload progress tracking and disable server timeouts ([3aa7eac](https://github.com/albrtbc/subtleai/commit/3aa7eac247d76cdb4e23958f87c10bb4c22b7e12))

## [1.1.2](https://github.com/albrtbc/subtleai/compare/v1.1.1...v1.1.2) (2026-02-13)


### Bug Fixes

* add UUID fallback for non-secure contexts (HTTP) ([5a77a44](https://github.com/albrtbc/subtleai/commit/5a77a448d4a45d79a8914993abd8401e2f94950e))

## [1.1.1](https://github.com/albrtbc/subtleai/compare/v1.1.0...v1.1.1) (2026-02-13)


### Bug Fixes

* **ci:** only push Docker tags on release, remove main branch push ([a4e2f7b](https://github.com/albrtbc/subtleai/commit/a4e2f7bb3c144debaa202b9c59d9a6c70052706b))

# [1.1.0](https://github.com/albrtbc/subtleai/compare/v1.0.4...v1.1.0) (2026-02-13)


### Bug Fixes

* **ci:** add fetch-depth 0 for gitleaks to access full git history ([84d55f1](https://github.com/albrtbc/subtleai/commit/84d55f18089844805a9ee96a4132e57cf5e07e37))
* **ci:** fix gitleaks GITHUB_TOKEN and remove broken CodeRabbit action ([3068f3b](https://github.com/albrtbc/subtleai/commit/3068f3bc76271c199324168ab07c55e46d25a82d))


### Features

* cancel in-progress transcription jobs to avoid unnecessary API costs ([f90e732](https://github.com/albrtbc/subtleai/commit/f90e7324b5b834bf00dfd411219e8f45d41b7748))

## [1.0.4](https://github.com/albrtbc/subtleai/compare/v1.0.3...v1.0.4) (2026-02-13)


### Bug Fixes

* trigger Docker build on release event instead of tag push ([35a5af9](https://github.com/albrtbc/subtleai/commit/35a5af9f584831cc9e4cc5f5fe487078a5e80d60))

## [1.0.3](https://github.com/albrtbc/subtleai/compare/v1.0.2...v1.0.3) (2026-02-13)


### Bug Fixes

* use PAT for semantic-release to trigger Docker tag builds ([b42f356](https://github.com/albrtbc/subtleai/commit/b42f3567e938e4133a66ffa25e432522c7a021c9))

## [1.0.2](https://github.com/albrtbc/subtleai/compare/v1.0.1...v1.0.2) (2026-02-13)


### Bug Fixes

* resolve React eslint ref warning and trigger docker build on tag creation ([e8db29a](https://github.com/albrtbc/subtleai/commit/e8db29abbd661dad87bf108362b84249d0bdc8d7))

## [1.0.1](https://github.com/albrtbc/subtleai/compare/v1.0.0...v1.0.1) (2026-02-13)


### Bug Fixes

* improve docker tagging and stability ([31912cc](https://github.com/albrtbc/subtleai/commit/31912ccc70ffebc688f98fb913c272ad8a9d6b60))
* refine docker image tagging strategy ([fbbe7a3](https://github.com/albrtbc/subtleai/commit/fbbe7a31291dec3e082f56306eacbb96a5a1f970))

# 1.0.0 (2026-02-13)


### Bug Fixes

* resolve semantic-release dependency conflict ([8ed9162](https://github.com/albrtbc/subtleai/commit/8ed9162f372af47c19e8e041974ef10833746a53))
* update package-lock.json after workspace name changes ([ba7198a](https://github.com/albrtbc/subtleai/commit/ba7198a2043888b2444e98c7d4c4f4b36d8f23be))


### Features

* auto-hide API key input when server has configured key ([37478b2](https://github.com/albrtbc/subtleai/commit/37478b23a775ca8042057197eee3f1a644827f90))
* bulk import ([4a5de7c](https://github.com/albrtbc/subtleai/commit/4a5de7c062c86d3253340f822a4f85c48f7fb66b))
* enhance SRT generator with auto-download feature and video support ([1d5f790](https://github.com/albrtbc/subtleai/commit/1d5f790cc8efd980bb825123c9cea252376cdf01))
* implement critical security fixes and quality improvements ([0a64f2d](https://github.com/albrtbc/subtleai/commit/0a64f2d3e3944be4ff96a108a00a1e0aa34077be))

# 1.0.0 (2026-02-13)


### Bug Fixes

* resolve semantic-release dependency conflict ([8ed9162](https://github.com/albrtbc/subtleai/commit/8ed9162f372af47c19e8e041974ef10833746a53))
* update package-lock.json after workspace name changes ([ba7198a](https://github.com/albrtbc/subtleai/commit/ba7198a2043888b2444e98c7d4c4f4b36d8f23be))


### Features

* auto-hide API key input when server has configured key ([37478b2](https://github.com/albrtbc/subtleai/commit/37478b23a775ca8042057197eee3f1a644827f90))
* bulk import ([4a5de7c](https://github.com/albrtbc/subtleai/commit/4a5de7c062c86d3253340f822a4f85c48f7fb66b))
* enhance SRT generator with auto-download feature and video support ([1d5f790](https://github.com/albrtbc/subtleai/commit/1d5f790cc8efd980bb825123c9cea252376cdf01))
* implement critical security fixes and quality improvements ([0a64f2d](https://github.com/albrtbc/subtleai/commit/0a64f2d3e3944be4ff96a108a00a1e0aa34077be))
