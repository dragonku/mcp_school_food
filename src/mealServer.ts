import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from "axios";
import dotenv from "dotenv";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WebSocketServerTransport } from "@modelcontextprotocol/sdk/server/ws.js";

// 환경 변수 로드
dotenv.config();

// API 키 확인
const NEIS_API_KEY = process.env.NEIS_API_KEY;
if (!NEIS_API_KEY) {
  console.error("Error: NEIS API key not found in environment variables");
  console.error("Please add your API key to the .env file:");
  console.error("NEIS_API_KEY=your_api_key_here");
  process.exit(1);
}

// 학교 정보
const SCHOOL_INFO = {
  GYEONGGI_OFFICE_CODE: "J10",
  HYOWON_SCHOOL_CODE: "7530167"
};

// 날짜 관련 유틸리티 함수
function getDateString(daysOffset: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

// 자연어에서 날짜 추출 함수
function extractDateFromText(text: string): { date: string, dateOffset: number, type: "daily" | "weekly" } {
  // 기본값 설정
  let dateOffset = 0;
  let type: "daily" | "weekly" = "daily";
  let date = getDateString(dateOffset);

  // 연도 추출 (4자리 숫자)
  const yearMatch = text.match(/(\d{4})년/);
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
  
  // 월 추출 (1-12 사이의 숫자)
  const monthMatch = text.match(/(\d{1,2})월/);
  const month = monthMatch ? monthMatch[1].padStart(2, '0') : (new Date().getMonth() + 1).toString().padStart(2, '0');
  
  // 일 추출 (1-31 사이의 숫자)
  const dayMatch = text.match(/(\d{1,2})일/);
  const day = dayMatch ? dayMatch[1].padStart(2, '0') : new Date().getDate().toString().padStart(2, '0');
  
  // 오늘, 어제, 내일 등의 키워드 처리
  if (text.includes('오늘')) {
    dateOffset = 0;
  } else if (text.includes('어제')) {
    dateOffset = -1;
  } else if (text.includes('내일')) {
    dateOffset = 1;
  }
  
  // 이번주, 다음주 등의 키워드 처리
  if (text.includes('이번주')) {
    dateOffset = 0;
    type = "weekly";
  } else if (text.includes('다음주')) {
    dateOffset = 7;
    type = "weekly";
  }
  
  // 요일 처리 (월요일, 화요일 등)
  const weekdays = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];
  for (let i = 0; i < weekdays.length; i++) {
    if (text.includes(weekdays[i])) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const targetDay = (i + 1) % 7; // 월요일은 1, 일요일은 0
      const diff = targetDay - dayOfWeek;
      dateOffset = diff;
      break;
    }
  }
  
  // 명시적 날짜가 있는 경우 해당 날짜 사용
  if (yearMatch && monthMatch && dayMatch) {
    date = `${year}${month}${day}`;
  } else {
    date = getDateString(dateOffset);
  }
  
  return { date, dateOffset, type };
}

// 자연어에서 학교명 추출 함수
function extractSchoolName(text: string): string | null {
  const schoolPattern = /([가-힣]+(?:초등|중|고등)?학교)/;
  const match = text.match(schoolPattern);
  return match ? match[1] : null;
}

// 학교 검색 함수
async function searchSchool(schoolName: string): Promise<any> {
  try {
    console.log(`'${schoolName}' 학교를 검색합니다...`);
    
    const response = await axios.get('https://open.neis.go.kr/hub/schoolInfo', {
      params: {
        KEY: NEIS_API_KEY,
        Type: 'json',
        pIndex: 1,
        pSize: 100,
        SCHUL_NM: schoolName
      }
    });

    if (response.data?.schoolInfo?.[1]?.row) {
      return response.data.schoolInfo[1].row[0];
    }
    console.log('검색된 학교가 없습니다.');
    return null;
  } catch (error) {
    console.error('학교 검색 중 오류가 발생했습니다:', error);
    return null;
  }
}

async function getWeeklyMeals(schoolInfo: any, startOffset: number = 0): Promise<string> {
  const results = [];
  for (let i = 0; i < 5; i++) { // 월요일부터 금요일까지
    const dayOffset = startOffset + i;
    const date = getDateString(dayOffset);
    try {
      const response = await axios.get("https://open.neis.go.kr/hub/mealServiceDietInfo", {
        params: {
          KEY: NEIS_API_KEY,
          Type: "json",
          ATPT_OFCDC_SC_CODE: schoolInfo.ATPT_OFCDC_SC_CODE,
          SD_SCHUL_CODE: schoolInfo.SD_SCHUL_CODE,
          MLSV_YMD: date,
        }
      });
      
      const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + dayOffset);
      const weekDay = dayOfWeek[currentDate.getDay()];
      
      results.push(`[${date}(${weekDay}) 급식 메뉴]\n${parseMealMenu(response.data)}\n`);
    } catch (error) {
      results.push(`[${date} 급식 정보를 가져올 수 없습니다.]\n`);
    }
  }
  return results.join('\n');
}

// 서버 설정
const server = new McpServer({
  name: "korean-school-meal-bot",
  version: "1.0.0",
  description: "한국 학교 급식 정보 조회 서버",
  homepage: "https://github.com/yourusername/korean-school-meal-bot",
  author: {
    name: "Your Name",
    email: "your.email@example.com"
  }
});

// 환경에 따라 적절한 transport 사용
const transport = process.env.TRANSPORT === 'ws' 
  ? new WebSocketServerTransport({ port: process.env.PORT || 3000 })
  : new StdioServerTransport();

console.log("급식 정보 서버를 시작합니다...");
console.log("자연어 질문을 입력하세요 (예: '효원고등학교 어제 급식')");

server.connect(transport).catch(console.error);

// 급식 메뉴 파싱 함수
function parseMealMenu(mealData: any): string {
  if (!mealData?.mealServiceDietInfo?.[1]?.row) {
    return "해당 날짜의 급식 정보가 없습니다.";
  }

  const meals = mealData.mealServiceDietInfo[1].row;
  let result = "";

  for (const mealInfo of meals) {
    const menu = mealInfo.DDISH_NM.split("<br/>");
    const calories = mealInfo.CAL_INFO;
    result += `[${mealInfo.MMEAL_SC_NM} 메뉴]\n${menu.join("\n")}\n[칼로리 정보]\n${calories}\n\n`;
  }

  return result.trim();
}

// 급식 정보 조회 도구
server.tool(
  "getMealInfo",
  {
    type: z.enum(["daily", "weekly"]).describe("조회 유형 (daily: 하루, weekly: 주간)"),
    dateOffset: z.number().describe("조회할 날짜 오프셋 (0: 오늘, -1: 어제, 1: 내일, 7: 다음주)"),
    schoolInfo: z.object({
      ATPT_OFCDC_SC_CODE: z.string(),
      SD_SCHUL_CODE: z.string(),
      SCHUL_NM: z.string()
    }).describe("학교 정보")
  },
  async ({ type, dateOffset, schoolInfo }) => {
    try {
      if (type === "weekly") {
        // 주간 급식 정보 조회
        let weeklyMenu = "";
        for (let i = 0; i < 5; i++) {
          const currentOffset = dateOffset + i;
          const date = getDateString(currentOffset);
          try {
            const response = await axios.get("https://open.neis.go.kr/hub/mealServiceDietInfo", {
              params: {
                KEY: NEIS_API_KEY,
                Type: "json",
                ATPT_OFCDC_SC_CODE: schoolInfo.ATPT_OFCDC_SC_CODE,
                SD_SCHUL_CODE: schoolInfo.SD_SCHUL_CODE,
                MLSV_YMD: date,
              }
            });
            
            const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
            const currentDate = new Date();
            currentDate.setDate(currentDate.getDate() + currentOffset);
            const weekDay = dayOfWeek[currentDate.getDay()];
            
            weeklyMenu += `[${date}(${weekDay}) 급식 메뉴]\n${parseMealMenu(response.data)}\n\n`;
          } catch (error) {
            weeklyMenu += `[${date} 급식 정보를 가져올 수 없습니다.]\n\n`;
          }
        }
        return {
          content: [{
            type: "text",
            text: `[${schoolInfo.SCHUL_NM} 주간 급식 메뉴]\n\n${weeklyMenu}`
          }]
        };
      } else {
        // 일일 급식 정보 조회
        const date = getDateString(dateOffset);
        const response = await axios.get("https://open.neis.go.kr/hub/mealServiceDietInfo", {
          params: {
            KEY: NEIS_API_KEY,
            Type: "json",
            ATPT_OFCDC_SC_CODE: schoolInfo.ATPT_OFCDC_SC_CODE,
            SD_SCHUL_CODE: schoolInfo.SD_SCHUL_CODE,
            MLSV_YMD: date,
          }
        });

        const formattedMenu = parseMealMenu(response.data);
        const dateStr = dateOffset === 0 ? "오늘" : dateOffset === -1 ? "어제" : "내일";

        return {
          content: [{
            type: "text",
            text: `[${schoolInfo.SCHUL_NM} ${dateStr}(${date}) 급식 메뉴]\n\n${formattedMenu}`
          }]
        };
      }
    } catch (err) {
      const error = err as Error;
      return {
        content: [{
          type: "text",
          text: `급식 정보를 가져오는 중 오류가 발생했습니다: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// 급식 정보 조회 프롬프트
server.prompt(
  "askMeal",
  {
    question: z.string().describe("사용자의 급식 관련 질문"),
  },
  async ({ question }) => {
    try {
      // 학교명 추출
      const schoolName = extractSchoolName(question);
      if (!schoolName) {
        return {
          messages: [{
            role: "assistant",
            content: {
              type: "text",
              text: "학교명을 찾을 수 없습니다. 학교명을 포함하여 다시 질문해주세요."
            }
          }]
        };
      }

      // 학교 정보 검색
      const schoolInfo = await searchSchool(schoolName);
      if (!schoolInfo) {
        return {
          messages: [{
            role: "assistant",
            content: {
              type: "text",
              text: `'${schoolName}'을(를) 찾을 수 없습니다. 학교명을 정확히 입력해주세요.`
            }
          }]
        };
      }

      // 날짜 추출
      const { date, dateOffset, type } = extractDateFromText(question);

      return {
        messages: [{
          role: "assistant",
          content: {
            type: "text",
            text: `${schoolInfo.SCHUL_NM} 급식 정보를 조회합니다.`
          }
        }],
        tools: [{
          name: "getMealInfo",
          arguments: {
            type,
            dateOffset,
            schoolInfo
          }
        }]
      };
    } catch (error) {
      return {
        messages: [{
          role: "assistant",
          content: {
            type: "text",
            text: "급식 정보를 조회하는 중 오류가 발생했습니다."
          }
        }]
      };
    }
  }
); 