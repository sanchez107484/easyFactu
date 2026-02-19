import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VerifactuController } from './verifactu.controller';
import { VerifactuService } from './services/verifactu.service';
import { VerifactuHashService } from './services/verifactu-hash.service';
import { VerifactuXmlService } from './services/verifactu-xml.service';
import { VerifactuSignerService } from './services/verifactu-signer.service';
import { VerifactuSenderService } from './services/verifactu-sender.service';
import { VerifactuQrService } from './services/verifactu-qr.service';

@Module({
  imports: [HttpModule],
  controllers: [VerifactuController],
  providers: [
    VerifactuService,
    VerifactuHashService,
    VerifactuXmlService,
    VerifactuSignerService,
    VerifactuSenderService,
    VerifactuQrService,
  ],
  exports: [VerifactuService],
})
export class VerifactuModule {}
