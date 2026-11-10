# 블로그 배포

- 이 프로젝트의 배포 대상은 Cloudflare Pages다. 글이나 사이트를 수정한 뒤 ChatGPT Sites에 저장·배포하거나 Sites 소스 저장소에 푸시하지 않는다.
- 프로젝트 루트에서 `pnpm build`를 실행한다. 배포할 정적 파일은 `dist/`에 생성되며 대표 도메인은 `https://hmmlog.com`이다.
- GitHub Actions가 푸시와 풀 리퀘스트에서 빌드를 검증한다. `main` 푸시의 빌드가 성공하면 같은 작업에서 생성한 `dist/`를 Cloudflare Pages에 업로드한다.
- 새 Pages 프로젝트는 Direct Upload 방식으로 만들고 운영 브랜치를 `main`으로 설정한다. GitHub 저장소의 Actions secrets에 `CLOUDFLARE_ACCOUNT_ID`와 해당 계정의 Pages 편집 권한을 가진 `CLOUDFLARE_API_TOKEN`을 등록한다. 기본 프로젝트명은 `hmmlog`이며 다른 이름을 쓰면 Actions variable `CLOUDFLARE_PAGES_PROJECT`에 지정한다.
- 포스트를 작성하거나 수정할 때는 `src/content/AGENTS.md`의 작성 규칙을 따른다.
