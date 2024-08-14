import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IUser } from '../services/UserService/types';
import { AuthProvider, ExpertiseDomain, UserStatus } from '../types';
import { CompanyEntity } from './Company';
import { RoleEntity } from './Role';

@Entity('USER')
export class UserEntity extends BaseEntity implements IUser {
  constructor({
    id,
    email,
    firstName,
    lastName,
    authProvider,
    companyId,
    expertiseDomain,
    roles,
    status,
    isDeleted,
    hubspotId,
  }: {
    id?: UserEntity['id'];
    email?: UserEntity['email'];
    firstName?: UserEntity['firstName'];
    lastName?: UserEntity['lastName'];
    authProvider?: UserEntity['authProvider'];
    companyId?: UserEntity['companyId'];
    expertiseDomain?: UserEntity['expertiseDomain'];
    roles?: UserEntity['roles'];
    status?: UserEntity['status'];
    isDeleted?: UserEntity['isDeleted'];
    hubspotId?: UserEntity['hubspotId'];
  } = {}) {
    super();

    this.id = id!;
    this.email = email!;
    this.firstName = firstName!;
    this.lastName = lastName!;
    this.authProvider = authProvider!;
    this.companyId = companyId!;
    this.expertiseDomain = expertiseDomain;
    this.status = status!;
    this.roles = roles ?? undefined;
    this.isDeleted = isDeleted ?? false;
    this.hubspotId = hubspotId ?? undefined;
  }

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string;

  @Column({ name: 'first_name' })
  firstName!: string;

  @Column({ name: 'last_name' })
  lastName!: string;

  @Column({ name: 'is_deleted' })
  isDeleted!: boolean;

  @Column({ name: 'auth_provider', length: 6 })
  authProvider!: AuthProvider;

  @Column({ name: 'expertise_domain', type: 'varchar', nullable: true })
  expertiseDomain?: ExpertiseDomain | null;

  @Column({ name: 'company_id' })
  companyId!: string;

  @ManyToOne(() => CompanyEntity)
  @JoinColumn({ name: 'company_id', referencedColumnName: 'id' })
  company?: CompanyEntity;

  @Column({ type: 'varchar' })
  status!: UserStatus;

  @ManyToMany(() => RoleEntity, (role) => role.users)
  @JoinTable({
    name: 'USER_ROLE',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
  })
  roles?: RoleEntity[];

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
  updatedAt!: Date;

  @Column({
    name: 'hubspot_id',
    nullable: true,
    unique: true,
    type: 'varchar',
  })
  hubspotId?: string;
}

export type UserEntityWithRoles = UserEntity & { roles: RoleEntity[] };
export type ContextUser = UserEntityWithRoles & { company: CompanyEntity };
