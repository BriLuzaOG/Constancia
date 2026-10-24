import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AlertsModule } from './core/alerts/alerts.module';
import { AnchorModule } from './core/anchor/anchor.module';
import { ChaosModule } from './core/chaos/chaos.module';
import { EvidenceModule } from './core/evidence/evidence.module';
import { HealthModule } from './core/health/health.module';

// En desarrollo el front corre en Vite (5173) y este directorio no existe.
// En producción Nest sirve el build estático desde el mismo origen: una URL,
// cero CORS.
const webDist = join(process.cwd(), 'web', 'dist');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AlertsModule,
    HealthModule,
    EvidenceModule,
    AnchorModule,
    ChaosModule,
    ...(existsSync(webDist)
      ? [
          ServeStaticModule.forRoot({
            rootPath: webDist,
            exclude: ['/api/{*path}', '/events'],
          }),
        ]
      : []),
  ],
})
export class AppModule {}
