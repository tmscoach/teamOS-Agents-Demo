// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Prisma Client
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    conversation: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    agentEvent: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
    agentConfiguration: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  }
}))

// Mock Prisma from generated client
jest.mock('@/lib/generated/prisma', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    conversation: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    agentEvent: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
    agentConfiguration: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  }))
}))

// Mock lib/db.ts
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    conversation: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    agentEvent: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
    agentConfiguration: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  }
}))

// Mock console methods to prevent "Cannot log after tests are done" errors
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}

// Mock global Request if not available
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init) {
      this.url = input
      this.method = init?.method || 'GET'
      this.headers = new Headers(init?.headers || {})
      this.body = init?.body
    }
  }
}

// Mock global Headers if not available
if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init) {
      this.map = new Map()
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.map.set(key.toLowerCase(), value)
        })
      }
    }
    get(name) {
      return this.map.get(name.toLowerCase())
    }
    set(name, value) {
      this.map.set(name.toLowerCase(), value)
    }
  }
}

// Mock global Response if not available
if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body
      this.status = init?.status || 200
      this.statusText = init?.statusText || 'OK'
      this.headers = new Headers(init?.headers || {})
      this.ok = this.status >= 200 && this.status < 300
    }
    
    async json() {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body)
      }
      return this.body
    }
    
    async text() {
      if (typeof this.body === 'object') {
        return JSON.stringify(this.body)
      }
      return String(this.body)
    }
  }
}