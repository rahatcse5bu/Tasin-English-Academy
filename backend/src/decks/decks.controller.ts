import { Controller, Get, Param } from '@nestjs/common';
import { DecksService } from './decks.service';

/**
 * Public, read-only slide-deck API. No auth — this is free study content,
 * same policy as the Class-8 curriculum in LearningController.
 *
 * Routes (global prefix `api`):
 *   GET /api/decks                → library: papers → units → chapters
 *   GET /api/decks/index          → flat chapter list (search / prerender)
 *   GET /api/decks/:id            → one chapter's full teaching content
 *   GET /api/decks/:id/neighbours → previous / next chapter in the same paper
 */
@Controller('decks')
export class DecksController {
  constructor(private service: DecksService) {}

  @Get()
  catalogue() {
    return this.service.catalogue();
  }

  @Get('index')
  index() {
    return this.service.index();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Get(':id/neighbours')
  neighbours(@Param('id') id: string) {
    return this.service.neighbours(id);
  }
}
