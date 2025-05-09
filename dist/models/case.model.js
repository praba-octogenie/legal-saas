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
exports.Case = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const uuid_1 = require("uuid");
const tenant_model_1 = require("./tenant.model");
const client_model_1 = require("./client.model");
const user_model_1 = require("./user.model");
let Case = class Case extends sequelize_typescript_1.Model {
    static async generateIds(instance) {
        // Generate IDs for parties if they don't have one
        if (instance.parties && instance.parties.length > 0) {
            instance.parties = instance.parties.map(party => {
                if (!party.id) {
                    return { ...party, id: (0, uuid_1.v4)() };
                }
                return party;
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
exports.Case = Case;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        primaryKey: true,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
    }),
    __metadata("design:type", String)
], Case.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
    }),
    __metadata("design:type", String)
], Case.prototype, "title", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
        unique: true,
    }),
    __metadata("design:type", String)
], Case.prototype, "caseNumber", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: true,
    }),
    __metadata("design:type", String)
], Case.prototype, "description", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'active', 'on_hold', 'closed', 'archived']],
        },
    }),
    __metadata("design:type", String)
], Case.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
        validate: {
            isIn: [['civil', 'criminal', 'family', 'corporate', 'tax', 'intellectual_property', 'constitutional', 'administrative', 'arbitration', 'other']],
        },
    }),
    __metadata("design:type", String)
], Case.prototype, "type", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    __metadata("design:type", String)
], Case.prototype, "subType", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
    }),
    __metadata("design:type", String)
], Case.prototype, "court", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    __metadata("design:type", String)
], Case.prototype, "courtBranch", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    __metadata("design:type", String)
], Case.prototype, "judge", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    __metadata("design:type", String)
], Case.prototype, "opposingCounsel", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: true,
    }),
    __metadata("design:type", Date)
], Case.prototype, "filingDate", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: true,
    }),
    __metadata("design:type", Date)
], Case.prototype, "nextHearingDate", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    __metadata("design:type", String)
], Case.prototype, "priority", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => tenant_model_1.Tenant),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: false,
    }),
    __metadata("design:type", String)
], Case.prototype, "tenantId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => tenant_model_1.Tenant),
    __metadata("design:type", tenant_model_1.Tenant)
], Case.prototype, "tenant", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => client_model_1.Client),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: false,
    }),
    __metadata("design:type", String)
], Case.prototype, "clientId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => client_model_1.Client),
    __metadata("design:type", client_model_1.Client)
], Case.prototype, "client", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => user_model_1.User),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: false,
    }),
    __metadata("design:type", String)
], Case.prototype, "assignedTo", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => user_model_1.User),
    __metadata("design:type", user_model_1.User)
], Case.prototype, "assignedUser", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: [],
    }),
    __metadata("design:type", Array)
], Case.prototype, "parties", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: [],
    }),
    __metadata("design:type", Array)
], Case.prototype, "timeline", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: [],
    }),
    __metadata("design:type", Array)
], Case.prototype, "team", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: {},
    }),
    __metadata("design:type", Object)
], Case.prototype, "courtDetails", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: {},
    }),
    __metadata("design:type", Object)
], Case.prototype, "fees", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: {},
    }),
    __metadata("design:type", Object)
], Case.prototype, "metadata", void 0);
__decorate([
    sequelize_typescript_1.BeforeCreate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Case]),
    __metadata("design:returntype", Promise)
], Case, "generateIds", null);
exports.Case = Case = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'cases',
        timestamps: true,
    })
], Case);
exports.default = Case;
