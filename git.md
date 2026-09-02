# Git 명령어 일람

Git은 파일의 변경 이력을 관리하고 여러 사람이 함께 작업할 수 있도록 돕는 분산 버전 관리 시스템입니다.

## 1. 기본 설정

```bash
# 현재 설정 확인
git config --list

# 사용자 이름과 이메일 설정
git config --global user.name "이름"
git config --global user.email "email@example.com"

# 기본 브랜치 이름 설정
git config --global init.defaultBranch main

# 줄바꿈 처리 설정
# Windows
git config --global core.autocrlf true
# macOS/Linux
git config --global core.autocrlf input
```

## 2. 저장소 시작 및 복제

```bash
# 현재 폴더를 Git 저장소로 초기화
git init

# 원격 저장소를 복제
git clone https://github.com/사용자/저장소.git

# 저장소를 지정한 폴더에 복제
git clone https://github.com/사용자/저장소.git 폴더명

# 원격 저장소 주소 확인
git remote -v
```

## 3. 변경 사항 확인

```bash
# 작업 트리 상태 확인
git status

# 아직 스테이징하지 않은 변경 내용 확인
git diff

# 스테이징한 변경 내용 확인
git diff --staged

# 특정 파일의 변경 내용 확인
git diff -- 파일명

# 커밋 이력 확인
git log

git log --oneline

git log --oneline --graph --all --decorate
```

## 4. 파일 추가 및 커밋

```bash
# 특정 파일을 스테이징
git add 파일명

# 여러 파일을 스테이징
git add 파일1 파일2

# 현재 폴더의 변경 파일을 모두 스테이징
git add .

# 스테이징 영역에서 파일 제외
git restore --staged 파일명

# 변경 사항을 커밋
git commit -m "변경 내용 요약"

# 스테이징과 커밋을 한 번에 처리
# 이미 추적 중인 파일에만 사용
git commit -am "변경 내용 요약"

# 최근 커밋 메시지 또는 파일 변경을 수정
# 아직 원격 저장소에 push하지 않은 경우에 사용
git commit --amend
```

일반적인 작업 순서는 다음과 같습니다.

```bash
git status
git add .
git diff --staged
git commit -m "변경 내용 요약"
git push
```

## 5. 브랜치

```bash
# 로컬 브랜치 목록
git branch

# 원격 브랜치까지 표시
git branch -a

# 새 브랜치 생성
git branch feature/login

# 브랜치 이동
git switch feature/login

# 브랜치 생성 후 바로 이동
git switch -c feature/login

# 이전 방식의 브랜치 이동
# git switch를 지원하지 않는 환경에서 사용
git checkout feature/login

# 브랜치 이름 변경
git branch -m 새이름

# 브랜치 삭제
# 병합된 브랜치에 사용
git branch -d feature/login

# 병합 여부와 관계없이 강제 삭제
git branch -D feature/login
```

## 6. 병합과 충돌 해결

```bash
# 현재 브랜치에 대상 브랜치 병합
git switch main
git merge feature/login

# 병합 중 충돌이 발생하면 파일을 직접 수정한 뒤
git add 충돌이_해결된_파일

git commit

# 진행 중인 병합 취소
git merge --abort
```

충돌 표시를 모두 제거하고 원하는 내용을 남긴 뒤 `git add`해야 합니다.

```text
<<<<<<< HEAD
현재 브랜치의 내용
=======
병합하려는 브랜치의 내용
>>>>>>> feature/login
```

## 7. 원격 저장소와 동기화

```bash
# 원격 저장소 이름과 주소 확인
git remote -v

# 원격 저장소 추가
git remote add origin https://github.com/사용자/저장소.git

# 원격 저장소 주소 변경
git remote set-url origin https://github.com/사용자/새저장소.git

# 원격 변경 사항만 가져오기
git fetch origin

# 원격 변경 사항을 가져와 현재 브랜치에 병합
git pull

# rebase 방식으로 가져오기
git pull --rebase

# 현재 브랜치를 원격 저장소에 업로드
git push origin 브랜치명

# 현재 브랜치의 upstream을 설정하며 최초 업로드
git push -u origin 브랜치명

# 원격 브랜치 삭제
git push origin --delete 브랜치명
```

`pull`은 일반적으로 `fetch`와 `merge`를 한 번에 수행합니다. 팀 규칙에 따라 `git pull --rebase`를 사용할 수 있습니다.

## 8. Rebase

```bash
# 현재 브랜치를 main 최신 커밋 위에 재배치
git switch feature/login
git rebase main

# rebase 중 충돌 해결 후
git add 충돌이_해결된_파일
git rebase --continue

# 진행 중인 rebase 취소
git rebase --abort

# 마지막 커밋 이후 커밋을 합치거나 순서 변경
git rebase -i HEAD~3
```

이미 다른 사람이 사용하는 원격 브랜치의 커밋은 협의 없이 rebase하거나 강제 push하지 않습니다.

```bash
# 강제 push가 필요할 때 원격 변경을 덮어쓰지 않도록 확인하며 사용
git push --force-with-lease
```

## 9. 임시 저장소(Stash)

```bash
# 작업 중인 변경 사항을 임시 저장
git stash

# 메시지를 붙여 임시 저장
git stash push -m "작업 중인 로그인 화면"

# stash 목록 확인
git stash list

# 가장 최근 stash를 적용하고 목록에서 삭제
git stash pop

# 가장 최근 stash를 적용하지만 목록에는 유지
git stash apply

# 특정 stash 적용
git stash apply stash@{1}

# stash 삭제
git stash drop stash@{1}

# 모든 stash 삭제
git stash clear
```

## 10. 변경 사항 되돌리기

```bash
# 작업 트리의 파일 변경 취소
# 주의: 복구하기 어려우므로 실행 전 확인
git restore 파일명

# 모든 작업 트리 변경 취소
# 주의: 커밋하지 않은 변경 사항이 삭제됨
git restore .

# 특정 커밋의 변경을 반대 커밋으로 되돌림
# 이미 push한 커밋에 권장
git revert 커밋ID

# 마지막 커밋을 취소하되 변경 내용은 스테이징 상태로 유지
git reset --soft HEAD~1

# 마지막 커밋을 취소하고 변경 내용을 작업 트리에 유지
git reset --mixed HEAD~1

# 커밋과 변경 내용을 모두 삭제
# 주의: 복구하기 어려우므로 신중하게 사용
git reset --hard HEAD~1
```

공유된 원격 브랜치의 이력을 바꾸기보다는 `git revert`를 우선 사용합니다.

## 11. 커밋 조회 및 파일 추적

```bash
# 특정 커밋의 상세 내용 확인
git show 커밋ID

# 특정 파일의 커밋 이력 확인
git log -- 파일명

# 파일의 각 줄을 마지막으로 수정한 커밋 확인
git blame 파일명

# 커밋 메시지로 검색
git log --grep="검색어"

# 삭제되거나 이름이 바뀐 파일까지 포함해 로그 확인
git log --all --full-history -- 파일명

# 추적하지 않을 파일 확인
git ls-files --others --exclude-standard
```

## 12. 태그

```bash
# 태그 목록 확인
git tag

# 주석 태그 생성
git tag -a v1.0.0 -m "첫 번째 버전"

# 태그 상세 내용 확인
git show v1.0.0

# 태그를 원격 저장소에 업로드
git push origin v1.0.0

# 모든 태그 업로드
git push origin --tags

# 로컬 태그 삭제
git tag -d v1.0.0

# 원격 태그 삭제
git push origin --delete v1.0.0
```

## 13. `.gitignore`

Git으로 관리하지 않을 파일과 폴더는 저장소 루트의 `.gitignore`에 작성합니다.

```gitignore
# Python
__pycache__/
*.py[cod]
.venv/

# 환경 변수와 비밀 정보
.env
.env.*
!.env.example

# Node.js
node_modules/
dist/

# 운영체제와 IDE
.DS_Store
.vscode/
```

이미 추적 중인 파일은 `.gitignore`에 추가해도 자동으로 제외되지 않습니다.

```bash
# Git 추적에서만 제거하고 실제 파일은 유지
git rm --cached 파일명

git commit -m "추적하지 않을 파일 정리"
```

## 14. 유용한 단축 명령

```bash
# 별칭 등록
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all --decorate"
git config --global alias.last "log -1 HEAD"

# 사용 예
git st
git lg
git last
```

## 15. 자주 쓰는 점검 명령

```bash
# Git 버전 확인
git --version

# 현재 브랜치 확인
git branch --show-current

# 현재 커밋 ID 확인
git rev-parse HEAD

# 원격 브랜치 정보 갱신 후 삭제된 원격 브랜치 정리
git fetch --prune

# 커밋되지 않은 변경이 있는지 확인
git diff --quiet; echo $?
```

## 주의할 명령

다음 명령은 커밋하지 않은 작업이나 다른 사람의 이력을 잃게 만들 수 있으므로 실행 전에 `git status`와 `git log`를 확인합니다.

```bash
git reset --hard
git restore .
git clean -fd
git push --force
```

`git clean -fd`는 추적하지 않는 파일과 폴더를 삭제합니다. 삭제 전에 목록만 확인하려면 다음 명령을 사용합니다.

```bash
git clean -nd
```
