import { ReactionType } from '@telegraf/types/manage';

interface ReactionCount {
  /** Type of the reaction */
  type: ReactionType;
  /** Number of times the reaction was added */
  total_count: number;
}
