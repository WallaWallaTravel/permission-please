import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Health Check Endpoint
 *
 * Used by:
 * - Load balancers to determine instance health
 * - Monitoring systems to track uptime
 * - Kubernetes liveness/readiness probes
 * - IT departments to verify system status
 *
 * Returns:
 * - 200 OK: System is healthy
 * - 503 Service Unavailable: System has issues
 */

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: 'up' | 'down';
      latencyMs?: number;
      error?: string;
    };
    memory: {
      status: 'ok' | 'warning' | 'critical';
      usedMB: number;
      totalMB: number;
      percentUsed: number;
    };
  };
}

// Track server start time for uptime calculation
const startTime = Date.now();

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const timestamp = new Date().toISOString();

  // Check database connection
  let dbStatus: HealthStatus['checks']['database'] = { status: 'down' };
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;
    dbStatus = {
      status: 'up',
      latencyMs: dbLatency,
    };
  } catch (error) {
    dbStatus = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const usedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const totalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const percentUsed = Math.round((usedMB / totalMB) * 100);

  let memoryStatus: 'ok' | 'warning' | 'critical' = 'ok';
  if (percentUsed > 90) {
    memoryStatus = 'critical';
  } else if (percentUsed > 75) {
    memoryStatus = 'warning';
  }

  // Determine overall health
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (dbStatus.status === 'down') {
    overallStatus = 'unhealthy';
  } else if (memoryStatus === 'critical') {
    overallStatus = 'degraded';
  }

  const healthResponse: HealthStatus = {
    status: overallStatus,
    timestamp,
    version: process.env.npm_package_version || '0.1.0',
    uptime: Math.round((Date.now() - startTime) / 1000),
    checks: {
      database: dbStatus,
      memory: {
        status: memoryStatus,
        usedMB,
        totalMB,
        percentUsed,
      },
    },
  };

  // Return appropriate status code
  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

  return NextResponse.json(healthResponse, { status: statusCode });
}

/**
 * HEAD request for simple up/down checks
 */
export async function HEAD(): Promise<NextResponse> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
