import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { MulterError } from 'multer';
import { Response } from 'express';

// Nest 10 maps Multer errors by message; Multer 2.5 changed some wording.
// Preserve the upload API's 4xx behavior by using stable error codes instead.
@Catch(MulterError)
export class MulterErrorFilter implements ExceptionFilter {
  catch(error: MulterError, host: ArgumentsHost) {
    const status =
      error.code === 'LIMIT_FILE_SIZE'
        ? HttpStatus.PAYLOAD_TOO_LARGE
        : HttpStatus.BAD_REQUEST;
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({
        statusCode: status,
        message: error.message,
        error:
          status === HttpStatus.PAYLOAD_TOO_LARGE
            ? 'Payload Too Large'
            : 'Bad Request',
      });
  }
}
