import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DecksService } from './decks.service';
import { JwtAuthGuard, Roles, RolesGuard } from '../common/guards';

/**
 * Slide-deck API — teaching material, restricted to staff.
 *
 * These decks are what a mentor projects in class (with every answer in them),
 * so unlike the public Class-8 curriculum they require a logged-in user whose
 * role is `teacher` or `admin`. Students get their material through /resources.
 *
 * Routes (global prefix `api`):
 *   GET /api/decks                → library: papers → units → chapters
 *   GET /api/decks/index          → flat chapter list (search / prerender)
 *   GET /api/decks/:id            → one chapter's full teaching content
 *   GET /api/decks/:id/neighbours → previous / next chapter in the same paper
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'teacher')
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
