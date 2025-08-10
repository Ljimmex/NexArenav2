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
    const { data, error } = await this.supabase.client
      .from('matches')
      .insert({ ...dto })
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
    const { data, error } = await this.supabase.client
      .from('matches')
      .update({ ...dto, updated_at: new Date().toISOString() })
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
}