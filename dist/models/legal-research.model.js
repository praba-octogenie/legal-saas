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
exports.LegalResearch = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const uuid_1 = require("uuid");
const tenant_model_1 = require("./tenant.model");
const user_model_1 = require("./user.model");
const case_model_1 = require("./case.model");
let LegalResearch = class LegalResearch extends sequelize_typescript_1.Model {
    static async generateIds(instance) {
        // Generate IDs for results if they don't have one
        if (instance.results && instance.results.length > 0) {
            instance.results = instance.results.map(result => {
                if (!result.id) {
                    return { ...result, id: (0, uuid_1.v4)() };
                }
                return result;
            });
        }
        // Generate IDs for history entries if they don't have one
        if (instance.history && instance.history.length > 0) {
            instance.history = instance.history.map(entry => {
                if (!entry.id) {
                    return { ...entry, id: (0, uuid_1.v4)() };
                }
                return entry;
            });
        }
    }
};
exports.LegalResearch = LegalResearch;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        primaryKey: true,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
    }),
    __metadata("design:type", String)
], LegalResearch.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
    }),
    __metadata("design:type", String)
], LegalResearch.prototype, "title", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: true,
    }),
    __metadata("design:type", String)
], LegalResearch.prototype, "description", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: true,
    }),
    __metadata("design:type", String)
], LegalResearch.prototype, "query", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
        defaultValue: 'in_progress',
        validate: {
            isIn: [['in_progress', 'completed', 'archived']],
        },
    }),
    __metadata("design:type", String)
], LegalResearch.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
        validate: {
            isIn: [['case_law', 'statute', 'regulation', 'commentary', 'article', 'general', 'other']],
        },
    }),
    __metadata("design:type", String)
], LegalResearch.prototype, "type", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.STRING),
        allowNull: false,
        defaultValue: [],
    }),
    __metadata("design:type", Array)
], LegalResearch.prototype, "keywords", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.STRING),
        allowNull: false,
        defaultValue: [],
    }),
    __metadata("design:type", Array)
], LegalResearch.prototype, "sources", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => tenant_model_1.Tenant),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: false,
    }),
    __metadata("design:type", String)
], LegalResearch.prototype, "tenantId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => tenant_model_1.Tenant),
    __metadata("design:type", tenant_model_1.Tenant)
], LegalResearch.prototype, "tenant", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => user_model_1.User),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: false,
    }),
    __metadata("design:type", String)
], LegalResearch.prototype, "createdBy", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => user_model_1.User),
    __metadata("design:type", user_model_1.User)
], LegalResearch.prototype, "creator", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => case_model_1.Case),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: true,
    }),
    __metadata("design:type", String)
], LegalResearch.prototype, "caseId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => case_model_1.Case),
    __metadata("design:type", case_model_1.Case)
], LegalResearch.prototype, "case", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: [],
    }),
    __metadata("design:type", Array)
], LegalResearch.prototype, "results", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: [],
    }),
    __metadata("design:type", Array)
], LegalResearch.prototype, "history", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: true,
    }),
    __metadata("design:type", Object)
], LegalResearch.prototype, "analysis", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: {},
    }),
    __metadata("design:type", Object)
], LegalResearch.prototype, "filters", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: {},
    }),
    __metadata("design:type", Object)
], LegalResearch.prototype, "metadata", void 0);
__decorate([
    sequelize_typescript_1.BeforeCreate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LegalResearch]),
    __metadata("design:returntype", Promise)
], LegalResearch, "generateIds", null);
exports.LegalResearch = LegalResearch = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'legal_researches',
        timestamps: true,
    })
], LegalResearch);
exports.default = LegalResearch;
