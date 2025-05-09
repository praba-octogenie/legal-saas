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
exports.Client = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const uuid_1 = require("uuid");
const tenant_model_1 = require("./tenant.model");
let Client = class Client extends sequelize_typescript_1.Model {
    static async generateContactPersonId(instance) {
        // If contact persons exist but don't have IDs, generate them
        if (instance.contactPersons && instance.contactPersons.length > 0) {
            instance.contactPersons = instance.contactPersons.map(person => {
                if (!person.id) {
                    return { ...person, id: (0, uuid_1.v4)() };
                }
                return person;
            });
        }
    }
};
exports.Client = Client;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        primaryKey: true,
        defaultValue: sequelize_typescript_1.DataType.UUIDV4,
    }),
    __metadata("design:type", String)
], Client.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
    }),
    __metadata("design:type", String)
], Client.prototype, "name", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    __metadata("design:type", String)
], Client.prototype, "email", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    __metadata("design:type", String)
], Client.prototype, "phone", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
        defaultValue: 'individual',
        validate: {
            isIn: [['individual', 'corporate', 'government', 'ngo']],
        },
    }),
    __metadata("design:type", String)
], Client.prototype, "type", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
        defaultValue: 'active',
        validate: {
            isIn: [['active', 'inactive', 'blocked']],
        },
    }),
    __metadata("design:type", String)
], Client.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    __metadata("design:type", String)
], Client.prototype, "category", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => tenant_model_1.Tenant),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: false,
    }),
    __metadata("design:type", String)
], Client.prototype, "tenantId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => tenant_model_1.Tenant),
    __metadata("design:type", tenant_model_1.Tenant)
], Client.prototype, "tenant", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: {},
    }),
    __metadata("design:type", Object)
], Client.prototype, "address", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: {},
    }),
    __metadata("design:type", Object)
], Client.prototype, "kycDetails", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: {},
    }),
    __metadata("design:type", Array)
], Client.prototype, "contactPersons", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: {},
    }),
    __metadata("design:type", Object)
], Client.prototype, "preferences", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: {},
    }),
    __metadata("design:type", Object)
], Client.prototype, "portalAccess", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSONB,
        allowNull: false,
        defaultValue: {},
    }),
    __metadata("design:type", Object)
], Client.prototype, "metadata", void 0);
__decorate([
    sequelize_typescript_1.BeforeCreate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Client]),
    __metadata("design:returntype", Promise)
], Client, "generateContactPersonId", null);
exports.Client = Client = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: 'clients',
        timestamps: true,
    })
], Client);
exports.default = Client;
