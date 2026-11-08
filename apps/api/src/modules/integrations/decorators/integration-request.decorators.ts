import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  UseFilters,
} from '@nestjs/common';
import { ApiProduces } from '@nestjs/swagger';
import { Request } from 'express';
import { SkipResponseEnvelope } from '../../../common/decorators/skip-response-envelope.decorator';
import { ProblemDetailsFilter } from '../errors/problem-details.filter';
import { integrationValidationPipe } from '../pipes/integration-validation.pipe';

/** Contract shape for every integrations controller: raw JSON responses and Problem Details errors. */
export const IntegrationEndpoint = () =>
  applyDecorators(
    UseFilters(ProblemDetailsFilter),
    SkipResponseEnvelope(),
    ApiProduces('application/json', 'application/problem+json')
  );

const RequestBody = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): unknown => ctx.switchToHttp().getRequest<Request>().body
);

const RequestQuery = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): unknown => ctx.switchToHttp().getRequest<Request>().query
);

/** Request body validated with field-level errors (see integrationValidationPipe). */
export const IntegrationBody = () => RequestBody(integrationValidationPipe);

/** Query string validated with field-level errors (see integrationValidationPipe). */
export const IntegrationQuery = () => RequestQuery(integrationValidationPipe);
