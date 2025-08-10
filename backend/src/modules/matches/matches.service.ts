import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { CreateMatchDto } from './dto/create-match.dto'
import { UpdateMatchDto } from './dto/update-match.dto'
import { MatchDto, MatchStatus, MatchStage } from './dto/match.dto'

interface PaginationResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface ListFilters {
  status?: MatchStatus
  stage?: MatchStage
  team_id?: string
  scheduled_from?: string
  scheduled_to?: string
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
  page?: number
  limit?: number
}

@Injectable()
export class MatchesService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(dto: CreateMatchDto): Promise<MatchDto> {
    // Prepare match data with auto-generated numbers if not provided
    const matchData = { ...dto }
    
    // Auto-generate match_number if not provided
    if (!matchData.match_number) {
      matchData.match_number = await this.generateMatchNumber(dto.tournament_id, dto.stage, dto.group_number)
    }
    
    // Auto-generate group_number if not provided and stage is GROUP
    if (!matchData.group_number && dto.stage === MatchStage.GROUP) {
      matchData.group_number = await this.generateGroupNumber(dto.tournament_id)
    }

    const { data, error } = await this.supabase.client
      .from('matches')
      .insert(matchData)
      .select()
      .single()

    if (error) throw new BadRequestException(error.message)
    return data as unknown as MatchDto
  }

  async findAllByTournament(
    tournamentId: string,
    filters: ListFilters,
  ): Promise<PaginationResult<MatchDto>> {
    const {
      status,
      stage,
      team_id,
      scheduled_from,
      scheduled_to,
      sort_by = 'scheduled_at',
      sort_dir = 'asc',
      page = 1,
      limit = 20,
    } = filters

    if (page < 1 || limit < 1) throw new BadRequestException('Invalid pagination params')

    // Base query
    let query = this.supabase.client
      .from('matches')
      .select('*', { count: 'exact' })
      .eq('tournament_id', tournamentId)

    if (status) query = query.eq('status', status)
    if (stage) query = query.eq('stage', stage)

    if (team_id) {
      query = query.or(`team1_id.eq.${team_id},team2_id.eq.${team_id}`)
    }

    if (scheduled_from) query = query.gte('scheduled_at', scheduled_from)
    if (scheduled_to) query = query.lte('scheduled_at', scheduled_to)

    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.order(sort_by, { ascending: sort_dir === 'asc' }).range(from, to)

    const { data, error, count } = await query

    if (error) throw new BadRequestException(error.message)

    const total = count || 0
    const totalPages = Math.max(1, Math.ceil(total / limit))

    return { data: (data || []) as unknown as MatchDto[], total, page, limit, totalPages }
  }

  async findAllGlobal(filters: ListFilters & { tournament_id?: string }): Promise<PaginationResult<MatchDto>> {
    const {
      tournament_id,
      status,
      stage,
      team_id,
      scheduled_from,
      scheduled_to,
      sort_by = 'scheduled_at',
      sort_dir = 'asc',
      page = 1,
      limit = 20,
    } = filters

    if (page < 1 || limit < 1) throw new BadRequestException('Invalid pagination params')

    let query = this.supabase.client.from('matches').select('*', { count: 'exact' })

    if (tournament_id) query = query.eq('tournament_id', tournament_id)
    if (status) query = query.eq('status', status)
    if (stage) query = query.eq('stage', stage)
    if (team_id) query = query.or(`team1_id.eq.${team_id},team2_id.eq.${team_id}`)
    if (scheduled_from) query = query.gte('scheduled_at', scheduled_from)
    if (scheduled_to) query = query.lte('scheduled_at', scheduled_to)

    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.order(sort_by, { ascending: sort_dir === 'asc' }).range(from, to)

    const { data, error, count } = await query
    if (error) throw new BadRequestException(error.message)

    const total = count || 0
    const totalPages = Math.max(1, Math.ceil(total / limit))

    return { data: (data || []) as unknown as MatchDto[], total, page, limit, totalPages }
  }

  async getUpcoming(limit = 1): Promise<MatchDto[]> {
    const now = new Date().toISOString()
    const { data, error } = await this.supabase.client
      .from('matches')
      .select('*')
      .in('status', [MatchStatus.SCHEDULED, MatchStatus.UNSCHEDULED])
      .gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(limit)

    if (error) throw new BadRequestException(error.message)
    return (data || []) as unknown as MatchDto[]
  }

  async findRecentByUser(userId: string, page = 1, limit = 10): Promise<PaginationResult<MatchDto>> {
    if (page < 1 || limit < 1) throw new BadRequestException('Invalid pagination params')

    // 1) Get active team memberships for the user
    const { data: memberships, error: memErr } = await this.supabase.client
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (memErr) throw new BadRequestException(memErr.message)

    const teamIds = (memberships || []).map((m: any) => m.team_id)
    if (teamIds.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 1 }
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    // 2) Query recent finished matches where any of the user's teams participated
    let query = this.supabase.client
      .from('matches')
      .select('*', { count: 'exact' })
      .eq('status', MatchStatus.FINISHED)
      .or(`team1_id.in.(${teamIds.join(',')}),team2_id.in.(${teamIds.join(',')})`)
      .order('finished_at', { ascending: false })
      .range(from, to)

    const { data, error, count } = await query
    if (error) throw new BadRequestException(error.message)

    const total = count || 0
    const totalPages = Math.max(1, Math.ceil(total / limit))

    return { data: (data || []) as unknown as MatchDto[], total, page, limit, totalPages }
  }

  async findOne(id: string): Promise<MatchDto> {
    const { data, error } = await this.supabase.client.from('matches').select('*').eq('id', id).single()
    if (error) throw new NotFoundException('Match not found')
    return data as unknown as MatchDto
  }

  async update(id: string, dto: UpdateMatchDto): Promise<MatchDto> {
    // Prepare update data
    const updateData: any = { ...dto, updated_at: new Date().toISOString() }
    
    // Auto-set timestamps based on status changes
    if (dto.status) {
      const now = new Date().toISOString()
      
      // Set started_at when match goes LIVE (if not already set)
      if (dto.status === MatchStatus.LIVE && !dto.started_at) {
        updateData.started_at = now
      }
      
      // Set finished_at when match is FINISHED (if not already set)
      if (dto.status === MatchStatus.FINISHED && !dto.finished_at) {
        updateData.finished_at = now
      }
    }

    const { data, error } = await this.supabase.client
      .from('matches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new BadRequestException(error.message)
    return data as unknown as MatchDto
  }

  async remove(id: string): Promise<{ id: string }> {
    const { error } = await this.supabase.client.from('matches').delete().eq('id', id)
    if (error) throw new BadRequestException(error.message)
    return { id }
  }

  async startMatch(id: string): Promise<MatchDto> {
    const now = new Date().toISOString()
    const { data, error } = await this.supabase.client
      .from('matches')
      .update({ 
        status: MatchStatus.LIVE, 
        started_at: now,
        updated_at: now 
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new BadRequestException(error.message)
    return data as unknown as MatchDto
  }

  async finishMatch(id: string, winnerId?: string): Promise<MatchDto> {
    const now = new Date().toISOString()
    const updateData: any = { 
      status: MatchStatus.FINISHED, 
      finished_at: now,
      updated_at: now 
    }
    
    if (winnerId) {
      updateData.winner_id = winnerId
    }

    const { data, error } = await this.supabase.client
      .from('matches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new BadRequestException(error.message)
    return data as unknown as MatchDto
  }

  /**
   * Generate the next match number for a tournament/stage combination
   * Numbers are continuous across all groups within the same stage
   */
  private async generateMatchNumber(tournamentId: string, stage: MatchStage, groupNumber?: number): Promise<number> {
    let query = this.supabase.client
      .from('matches')
      .select('match_number')
      .eq('tournament_id', tournamentId)
      .eq('stage', stage)
      .not('match_number', 'is', null)
      .order('match_number', { ascending: false })
      .limit(1)

    // Don't filter by group_number - we want continuous numbering across all groups

    const { data, error } = await query

    if (error) throw new BadRequestException(`Error generating match number: ${error.message}`)

    // If no matches exist, start with 1, otherwise increment the highest number
    const highestNumber = data && data.length > 0 ? data[0].match_number : 0
    return highestNumber + 1
  }

  /**
   * Generate the next group number for a tournament
   */
  private async generateGroupNumber(tournamentId: string): Promise<number> {
    const { data, error } = await this.supabase.client
      .from('matches')
      .select('group_number')
      .eq('tournament_id', tournamentId)
      .eq('stage', MatchStage.GROUP)
      .not('group_number', 'is', null)
      .order('group_number', { ascending: false })
      .limit(1)

    if (error) throw new BadRequestException(`Error generating group number: ${error.message}`)

    // If no group matches exist, start with 1, otherwise increment the highest number
    const highestNumber = data && data.length > 0 ? data[0].group_number : 0
    return highestNumber + 1
  }
}