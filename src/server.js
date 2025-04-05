import { WebSocketServer } from 'ws';
import { fetchSpecificDateMeal, fetchThisWeekMeals } from './fetchMeal.js';
import { searchSchools, getOfficeList, getSchoolTypes } from './schoolInfo.js';

const wss = new WebSocketServer({ port: 8080 });

const tools = {
  searchSchools: {
    description: '학교를 검색합니다',
    parameters: {
      type: 'object',
      properties: {
        officeName: {
          type: 'string',
          description: '교육청 이름 (예: 경기도, 서울)'
        },
        schoolType: {
          type: 'string',
          description: '학교 유형 (예: 초등학교, 중학교, 고등학교)'
        },
        schoolName: {
          type: 'string',
          description: '학교 이름'
        }
      },
      required: ['officeName', 'schoolType', 'schoolName']
    }
  },
  getOfficeList: {
    description: '교육청 목록을 조회합니다'
  },
  getSchoolTypes: {
    description: '학교 유형 목록을 조회합니다'
  },
  getMealByDate: {
    description: '특정 날짜의 급식 정보를 조회합니다',
    parameters: {
      type: 'object',
      properties: {
        schoolInfo: {
          type: 'object',
          description: '학교 정보 (searchSchools의 결과)',
          properties: {
            name: { type: 'string' },
            code: { type: 'string' },
            officeCode: { type: 'string' }
          },
          required: ['name', 'code', 'officeCode']
        },
        date: {
          type: 'string',
          description: 'YYYYMMDD 형식의 날짜'
        }
      },
      required: ['schoolInfo', 'date']
    }
  },
  getWeeklyMeals: {
    description: '이번 주의 급식 정보를 조회합니다',
    parameters: {
      type: 'object',
      properties: {
        schoolInfo: {
          type: 'object',
          description: '학교 정보 (searchSchools의 결과)',
          properties: {
            name: { type: 'string' },
            code: { type: 'string' },
            officeCode: { type: 'string' }
          },
          required: ['name', 'code', 'officeCode']
        }
      },
      required: ['schoolInfo']
    }
  }
};

wss.on('connection', (ws) => {
  console.log('클라이언트가 연결되었습니다');

  // 도구 목록 전송
  ws.send(JSON.stringify({
    type: 'tools',
    tools
  }));

  ws.on('message', async (message) => {
    try {
      const request = JSON.parse(message);
      
      switch (request.tool) {
        case 'searchSchools':
          const schools = await searchSchools(
            request.parameters.officeName,
            request.parameters.schoolType,
            request.parameters.schoolName
          );
          ws.send(JSON.stringify({ 
            type: 'result',
            tool: request.tool,
            result: schools
          }));
          break;

        case 'getOfficeList':
          const offices = getOfficeList();
          ws.send(JSON.stringify({ 
            type: 'result',
            tool: request.tool,
            result: offices
          }));
          break;

        case 'getSchoolTypes':
          const types = getSchoolTypes();
          ws.send(JSON.stringify({ 
            type: 'result',
            tool: request.tool,
            result: types
          }));
          break;

        case 'getMealByDate':
          const meal = await fetchSpecificDateMeal(
            request.parameters.schoolInfo,
            request.parameters.date
          );
          ws.send(JSON.stringify({ 
            type: 'result',
            tool: request.tool,
            result: meal
          }));
          break;

        case 'getWeeklyMeals':
          const weeklyMeals = await fetchThisWeekMeals(request.parameters.schoolInfo);
          ws.send(JSON.stringify({ 
            type: 'result',
            tool: request.tool,
            result: weeklyMeals
          }));
          break;

        default:
          throw new Error('알 수 없는 도구입니다.');
      }
    } catch (error) {
      ws.send(JSON.stringify({ 
        type: 'error',
        error: error.message 
      }));
    }
  });
});

console.log('MCP 서버가 시작되었습니다. 포트: 8080'); 