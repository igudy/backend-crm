import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('API documentation for my NestJS application')
    .setVersion('1.0')
    .addBearerAuth() // Enables JWT bearer token in Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keeps JWT token when refreshing
    },
  });
  await app.listen(3000);
  console.log(`✅ App is running on http://localhost:3000/api/docs`);
}
bootstrap();
