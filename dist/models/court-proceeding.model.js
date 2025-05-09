"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourtProceeding = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const uuid_1 = require("uuid");
const tenant_model_1 = require("./tenant.model");
const case_model_1 = require("./case.model");
const user_model_1 = require("./user.model");
let CourtProceeding = class CourtProceeding extends sequelize_typescript_1.Model {
    static async generateIds(instance) {
        // Generate IDs for attendees if they don't have one
        if (instance.attendees && instance.attendees.length > 0) {
            instance.attendees = instance.attendees.map(attendee => {
                if (!attendee.id) {
                    return { ...attendee, id: (0, uuid_1.v4)() };
                }
                return attendee;
            });
        }
        // Generate IDs for documents if they don't have one
        if (instance.documents && instance.documents.length > 0) {
            instance.documents = instance.documents.map(document => {
                if (!document.id) {
                    return { ...document, id: (0, uuid_1.v4)() };
                }
                return document;
            });
        }
        // Generate IDs for tasks if they don't have one
        if (instance.tasks && instance.tasks.length > 0) {
            instance.tasks = instance.tasks.map(task => {
                if (!task.id) {
                    return { ...task, id: (0, uuid_1.v4)() };
                }
                return task;
            });
        }
        // Generate IDs for timeline events if they don't have one
        if (instance.timeline && instance.timeline.length > 0) {
            instance.timeline = instance.timeline.map(event => {
                if (!event.id) {
                    return { ...event, id: (0, uuid_1.v4)() };
                }
                return event;
            });
        }
    }
};
exports.CourtProceeding = CourtProceeding;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        primaryKey: true,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
    }),
    __metadata("design:type", String)
], CourtProceeding.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
    }),
    __metadata("design:type", String)
], CourtProceeding.prototype, "title", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: false,
    }),
    __metadata("design:type", Date)
], CourtProceeding.prototype, "date", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TIME,
        allowNull: true,
    }),
    __metadata("design:type", String)
], CourtProceeding.prototype, "time", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
        defaultValue: 'scheduled',
        validate: {
            isIn: [['scheduled', 'in_progress', 'completed', 'adjourned', 'cancelled']],
        },
    }),
    __metadata("design:type", String)
], CourtProceeding.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
        validate: {
            isIn: [['hearing', 'trial', 'conference', 'motion', 'appeal', 'judgment', 'order', 'other']],
        },
    }),
    __metadata("design:type", String)
], CourtProceeding.prototype, "type", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    __metadata("design:type", String)
], CourtProceeding.prototype, "courtRoom", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    __metadata("design:type", String)
], CourtProceeding.prototype, "judge", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: true,
    }),
    __metadata("design:type", String)
], CourtProceeding.prototype, "description", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: true,
    }),
    __metadata("design:type", String)
], CourtProceeding.prototype, "notes", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: true,
    }),
    __metadata("design:type", Date)
], CourtProceeding.prototype, "nextDate", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    __metadata("design:type", String)
], CourtProceeding.prototype, "outcome", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => tenant_model_1.Tenant),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: false,
    }),
    __metadata("design:type", String)
], CourtProceeding.prototype, "tenantId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => tenant_model_1.Tenant),
    __metadata("design:type", tenant_model_1.Tenant)
], CourtProceeding.prototype, "tenant", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => case_model_1.Case),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: false,
    }),
    __metadata("design:type", String)
], CourtProceeding.prototype, "caseId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => case_model_1.Case),
    __metadata("design:type", case_model_1.Case)
], CourtProceeding.prototype, "case", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => user_model_1.User),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: false,
    }),
    __metadata("design:type", String)
], CourtProceeding.prototype, "createdBy", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => user_model_1.User),
    __metadata("design:type", user_model_1.User)
], CourtProceeding.prototype, "creator", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: [],
    }),
    __metadata("design:type", Array)
], CourtProceeding.prototype, "attendees", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: [],
    }),
    __metadata("design:type", Array)
], CourtProceeding.prototype, "documents", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: [],
    }),
    __metadata("design:type", Array)
], CourtProceeding.prototype, "tasks", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: [],
    }),
    __metadata("design:type", Array)
], CourtProceeding.prototype, "timeline", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: {},
    }),
    __metadata("design:type", Object)
], CourtProceeding.prototype, "metadata", void 0);
__decorate([
    sequelize_typescript_1.BeforeCreate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CourtProceeding]),
    __metadata("design:returntype", Promise)
], CourtProceeding, "generateIds", null);
exports.CourtProceeding = CourtProceeding = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'court_proceedings',
        timestamps: true,
    })
], CourtProceeding);
exports.default = CourtProceeding;
