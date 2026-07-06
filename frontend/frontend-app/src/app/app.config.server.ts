import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { appConfig } from './app.config';

export const config: ApplicationConfig = mergeApplicationConfig(appConfig);
