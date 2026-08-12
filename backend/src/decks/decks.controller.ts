import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { DecksService } from './decks.service';
import { ContentDto, PlacementDto, UnitDto } from './decks.dto';
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
 *   GET   /api/decks/units          → the units that exist (for the editor)
 *   GET   /api/decks/:id            → one chapter's full teaching content
 *   GET   /api/decks/:id/neighbours → previous / next chapter in the same paper
 *   PATCH /api/decks/unit           → rename / renumber a whole unit
 *   PATCH /api/decks/:id/placement  → move one chapter to another unit or lesson
 *   PATCH /api/decks/:id/content    → edit its passage, questions, tables and summary
 *   PATCH /api/decks/:id/visible    → hide a chapter from the class list, or show it
 *   PATCH /api/decks/:id/restore    → undo a removal
 *   DELETE /api/decks/:id           → remove a chapter (soft, so it can come back)
 *
 * The two PATCH routes are how a mentor corrects the syllabus mapping (e.g.
 * "Adolescence is Unit 09, not Unit 03") without a redeploy. Editing sets
 * `placementLocked`, so the next `npm run seed` refreshes the teaching content
 * but leaves the correction in place.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'teacher')
@Controller('decks')
export class DecksController {
  constructor(private service: DecksService) {}

  @Get()
  catalogue(@Query('deleted') deleted?: string) {
    // ?deleted=1 lists the removed chapters so they can be restored
    return this.service.catalogue(deleted === '1');
  }

  @Get('index')
  index() {
    return this.service.index();
  }

  @Get('units')
  units() {
    return this.service.units();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Get(':id/neighbours')
  neighbours(@Param('id') id: string) {
    return this.service.neighbours(id);
  }

  /** Rename or renumber an entire unit — all its chapters move together. */
  @Patch('unit')
  setUnit(@Body() dto: UnitDto) {
    return this.service.setUnit(dto);
  }

  /** Move a single chapter into another unit / lesson. */
  @Patch(':id/placement')
  setPlacement(@Param('id') id: string, @Body() dto: PlacementDto) {
    return this.service.setPlacement(id, dto);
  }

  /** Add or edit the questions, table and summary a mentor maintains. */
  @Patch(':id/content')
  setContent(@Param('id') id: string, @Body() dto: ContentDto) {
    return this.service.setContent(id, dto);
  }

  /** Hide a chapter from the class list without losing it. */
  @Patch(':id/visible')
  setVisible(@Param('id') id: string, @Body() body: { isPublished: boolean }) {
    return this.service.setVisible(id, body.isPublished !== false);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.service.restore(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
