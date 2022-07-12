import {expect} from "chai";
import {describe} from "razmin";
import {ReflectedClassRef, ReflectedInterfaceRef, ReflectedTypeRef} from ".";
import {runSimple} from "../runner.test";
import {reify, reflect} from "./reflect";

describe('reflect<T>()', it => {
    it('reifies and reflects', async () => {
        let exports = await runSimple({
            modules: {
                "typescript-rtti": {reify, reflect},
            },
            code: `
                import { reflect } from 'typescript-rtti';
                export type Something = number;
                export const reflectedTypeRef = reflect<Something>();
                export function test(x: Something) {
                    return reflect<Something>();
                }
            `,
        });
        expect(exports.reflectedTypeRef.isAliased()).to.equal(true);
        expect((exports.reflectedTypeRef as ReflectedTypeRef).as('alias').token)
            .to.equal(exports.AΦSomething);
    });
    it('alias conversions', async () => {
        let exports = await runSimple({
            modules: {
                "typescript-rtti": {reify, reflect},
            },
            code: `
                import { reflect } from 'typescript-rtti';
                export type Something = number;
                export const reflectedTypeRef = reflect<Something>();
                export function test(x: Something) {
                    return reflect<Something>();
                }
            `,
        });
        expect(exports.reflectedTypeRef.isAliased()).to.equal(true);
        expect((exports.reflectedTypeRef as ReflectedTypeRef).as('class').class)
            .to.equal(Number);
        expect((exports.reflectedTypeRef as ReflectedTypeRef).as('class').isAliased()).to.equal(true);
        expect((exports.reflectedTypeRef as ReflectedTypeRef).as(ReflectedClassRef).class)
            .to.equal(Number);
        expect((exports.reflectedTypeRef as ReflectedTypeRef).as('class').as("alias").token)
            .to.equal(exports.AΦSomething);
    });
    it('alias transparency', async () => {
        let exports = await runSimple({
            modules: {
                "typescript-rtti": {reify, reflect},
            },
            code: `
                import { reflect } from 'typescript-rtti';
                export type Something = number;
                export type SomethingLiteral = 1;
                export interface C {
                    a: Something;
                    b: SomethingLiteral;
                }
                export type B = C;
                export type A = B;
                export const reflectedTypeRef = reflect<A>();
            `,
        });
        const alias = exports.reflectedTypeRef as ReflectedTypeRef;
        expect(alias.isAliased()).to.equal(true);
        expect(alias.kind)
            .to.equal("interface");
        expect(alias.as(ReflectedInterfaceRef).kind)
            .to.equal("interface");
        expect(alias.as(ReflectedInterfaceRef).reflectedInterface.getProperty("a").type.isAliased())
            .to.equal(true);
        expect(alias.as(ReflectedInterfaceRef).reflectedInterface.getProperty("a").type.kind)
            .to.equal("class");
        expect(alias.as(ReflectedInterfaceRef).reflectedInterface.getProperty("a").type.as("class").class)
            .to.equal(Number);
        expect(alias.as(ReflectedInterfaceRef).reflectedInterface.getProperty("b").type.isAliased())
            .to.equal(true);
        expect(alias.as(ReflectedInterfaceRef).reflectedInterface.getProperty("b").type.isNumberLiteral())
            .to.equal(true);
        expect(alias.as(ReflectedInterfaceRef).reflectedInterface.getProperty("a").type.as("class").class)
            .to.equal(Number);
        expect(alias.as('interface').as("alias").token)
            .to.equal(exports.AΦA);
    });
    it(`reflects properly for alias object`, async () => {
        let exports = await runSimple({
            modules: {
                "typescript-rtti": {reify, reflect},
            },
            code: `
                import { reflect } from 'typescript-rtti';
                export type Something = number;
                export type SomethingLiteral = 1;
                export interface C {
                    a: Something;
                    b: SomethingLiteral;
                }
                export type B = C;
                export type A = B;
                export const reflectedTypeRef = reflect<A>();
            `,
        });
        // @ TODO
        let ref = reflect(exports.reflectedTypeRef.as("alias").token);
        // @ts-ignore
        expect(ref.isAliased()).to.equal(true);
        // @ts-ignore
        expect(ref.name).to.equal('IMovable');
    });
    it('alias match value', async () => {
        let exports = await runSimple({
            modules: {
                "typescript-rtti": {reify, reflect},
            },
            code: `
                import { reflect } from 'typescript-rtti';
                export type Something = number;
                export type SomethingLiteral = 1;
                export interface C {
                    a: Something;
                    b: SomethingLiteral;
                }
                export type B = C;
                export type A = B;
                export const reflectedTypeRef = reflect<A>();
            `,
        });
        const alias = exports.reflectedTypeRef as ReflectedTypeRef;
        expect(alias.isAliased()).to.equal(true);
        expect(alias.matchesValue({
            a: 2, b: 1
        }))
            .to.equal(true);
        expect(alias.matchesValue({
            a: "hello", b: 2
        }))
            .to.equal(false);
    });
    it(`doesn't rewrite other calls into typescript-rtti`, async () => {
        let exports = await runSimple({
            modules: {
                'typescript-rtti': {
                    other(passed?) {
                        return passed ?? 123;
                    }
                }
            },
            code: `
                import { reflect, other } from 'typescript-rtti';
                type A = {}
                export const value1 = other();
                export const value2 = other<A>();
            `
        });

        expect(exports.value1).to.equal(123);
        expect(exports.value2).to.equal(123);
    });
    it(`doesn't rewrite any calls for other libraries`, async () => {
        let exports = await runSimple({
            modules: {
                'other': {
                    reflect(passed?) {
                        return passed ?? 123;
                    },
                    reify(passed?) {
                        return passed ?? 123;
                    }
                }
            },
            code: `
                import { reflect, reify } from 'other';
                type A = {}
                export const value1 = reflect();
                export const value2 = reflect<A>();
                export const value3 = reify();
                export const value4 = reify<A>();
            `
        });

        expect(exports.value1).to.equal(123);
        expect(exports.value2).to.equal(123);
        expect(exports.value3).to.equal(123);
        expect(exports.value4).to.equal(123);
    });
});
