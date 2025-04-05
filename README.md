# 한국 학교 급식 정보 조회 서버

NEIS Open API를 활용하여 전국 학교의 급식 정보를 조회할 수 있는 MCP(Model Context Protocol) 서버입니다.

## 기능

- 학교명으로 학교 검색
- 일일 급식 정보 조회
- 주간 급식 정보 조회
- 자연어 입력 지원 (예: "효원고등학교 어제 급식")

## 설치 및 실행

1. 의존성 설치:
```bash
npm install
```

2. 환경 변수 설정:
`.env` 파일을 생성하고 다음 내용을 입력합니다:
```bash
NEIS_API_KEY=your_api_key_here
PORT=3000
TRANSPORT=ws
```

3. 개발 모드 실행:
```bash
npm run dev
```

4. 프로덕션 모드 실행:
```bash
npm run build
npm start
```

## API 사용 예시

```typescript
// 일일 급식 정보 조회
{
  "question": "효원고등학교 오늘 급식"
}

// 주간 급식 정보 조회
{
  "question": "효원고등학교 이번주 급식"
}
```

## 환경 변수

- `NEIS_API_KEY`: NEIS Open API 키 (필수)
- `PORT`: 서버 포트 (기본값: 3000)
- `TRANSPORT`: 전송 방식 (ws 또는 stdio)

## 라이선스

ISC
