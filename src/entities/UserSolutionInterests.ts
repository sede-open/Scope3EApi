import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from 'typeorm';

import { SolutionInterestsEntity } from './SolutionInterests';
import { UserEntity } from './User';

@Entity('USER_SOLUTION_INTERESTS')
export class UserSolutionInterestsEntity extends BaseEntity {
  constructor(userId: string, solutionInterestId: string) {
    super();

    this.userId = userId;
    this.solutionInterestId = solutionInterestId;
  }

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'user_id',
    type: 'uniqueidentifier',
  })
  userId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user!: UserEntity;

  @Column({
    name: 'solution_interest_id',
    type: 'uniqueidentifier',
  })
  solutionInterestId!: string;

  @ManyToOne(() => SolutionInterestsEntity)
  @JoinColumn({ name: 'solution_interest_id', referencedColumnName: 'id' })
  solutionInterest!: SolutionInterestsEntity;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  readonly createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    onUpdate: 'CURRENT_TIMESTAMP',
    nullable: true,
  })
  readonly updatedAt!: Date;
}
