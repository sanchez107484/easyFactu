import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VerifactuController } from './verifactu.controller';
import { VerifactuService } from './services/verifactu.service';
import { VerifactuHashService } from './services/verifactu-hash.service';
import { VerifactuXmlService } from './services/verifactu-xml.service';
import { VerifactuSignerService } from './services/verifactu-signer.service';
import { VerifactuSenderService } from './services/verifactu-sender.service';
import { VerifactuQrService } from './services/verifactu-qr.service';
import { SpainHaciendaAdapter } from './adapters/spain/spain-hacienda.adapter';
import { NavarraHaciendaAdapter } from './adapters/navarra/navarra-hacienda.adapter';
import { HACIENDA_ADAPTER } from './interfaces/hacienda-adapter.interface';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [VerifactuController],
  providers: [
    VerifactuService,
    VerifactuHashService,
    // Servicios especializados usados internamente por SpainHaciendaAdapter
    VerifactuXmlService,
    VerifactuSignerService,
    VerifactuSenderService,
    VerifactuQrService,
    // Adapters concretos
    SpainHaciendaAdapter,
    NavarraHaciendaAdapter,
    // Factory que selecciona el adapter según HACIENDA_ADAPTER env var
    {
      provide: HACIENDA_ADAPTER,
      useFactory: (
        config: ConfigService,
        spain: SpainHaciendaAdapter,
        navarra: NavarraHaciendaAdapter
      ): SpainHaciendaAdapter | NavarraHaciendaAdapter => {
        const adapter = config.get<string>('HACIENDA_ADAPTER', 'spain');
        return adapter === 'navarra' ? navarra : spain;
      },
      inject: [ConfigService, SpainHaciendaAdapter, NavarraHaciendaAdapter],
    },
  ],
  exports: [VerifactuService],
})
export class VerifactuModule {}
