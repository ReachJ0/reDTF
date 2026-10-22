-- Database generated with pgModeler (PostgreSQL Database Modeler).
-- pgModeler version: 0.9.4
-- PostgreSQL version: 13.0
-- Project Site: pgmodeler.io
-- Model Author: ---

-- Database creation must be performed outside a multi lined SQL file. 
-- These commands were put in this file only as a convenience.
-- 
-- object: reachd | type: DATABASE --
-- DROP DATABASE IF EXISTS reachd;
CREATE DATABASE reachd
	ENCODING = 'UTF8'
	LC_COLLATE = 'es_ES.UTF-8'
	LC_CTYPE = 'es_ES.UTF-8'
	TABLESPACE = pg_default
	OWNER = postgres;
-- ddl-end --


-- object: "Personas" | type: SCHEMA --
-- DROP SCHEMA IF EXISTS "Personas" CASCADE;
CREATE SCHEMA "Personas";
-- ddl-end --
ALTER SCHEMA "Personas" OWNER TO postgres;
-- ddl-end --
COMMENT ON SCHEMA "Personas" IS E'Personas las cuales estan en el sistema e interactuan con este mismo';
-- ddl-end --

-- object: "Seguridad" | type: SCHEMA --
-- DROP SCHEMA IF EXISTS "Seguridad" CASCADE;
CREATE SCHEMA "Seguridad";
-- ddl-end --
ALTER SCHEMA "Seguridad" OWNER TO postgres;
-- ddl-end --
COMMENT ON SCHEMA "Seguridad" IS E'tablas de seguridad presentes dentro del sistema';
-- ddl-end --

-- object: "Finanzas" | type: SCHEMA --
-- DROP SCHEMA IF EXISTS "Finanzas" CASCADE;
CREATE SCHEMA "Finanzas";
-- ddl-end --
ALTER SCHEMA "Finanzas" OWNER TO postgres;
-- ddl-end --

-- object: "Pedidos" | type: SCHEMA --
-- DROP SCHEMA IF EXISTS "Pedidos" CASCADE;
CREATE SCHEMA "Pedidos";
-- ddl-end --
ALTER SCHEMA "Pedidos" OWNER TO postgres;
-- ddl-end --

SET search_path TO pg_catalog,public,"Personas","Seguridad","Finanzas","Pedidos";
-- ddl-end --

-- object: "Personas"."Clientes" | type: TABLE --
-- DROP TABLE IF EXISTS "Personas"."Clientes" CASCADE;
CREATE TABLE "Personas"."Clientes" (
	id_cli integer NOT NULL,
	nombre_user character varying(250) NOT NULL,
	telf_user character varying(20) NOT NULL,
	"id_user_Usuarios" integer,
	CONSTRAINT id_cli PRIMARY KEY (id_cli),
	CONSTRAINT "CLientes_uq" UNIQUE ("id_user_Usuarios")
);
-- ddl-end --
COMMENT ON COLUMN "Personas"."Clientes".telf_user IS E'telefono del usuario';
-- ddl-end --
COMMENT ON CONSTRAINT id_cli ON "Personas"."Clientes"  IS E'id del cliente';
-- ddl-end --
ALTER TABLE "Personas"."Clientes" OWNER TO postgres;
-- ddl-end --

-- object: "Pedidos"."Estado de la Orden" | type: TABLE --
-- DROP TABLE IF EXISTS "Pedidos"."Estado de la Orden" CASCADE;
CREATE TABLE "Pedidos"."Estado de la Orden" (
	id_esta integer NOT NULL,
	nom_esta character varying(100) NOT NULL,
	CONSTRAINT id_esta PRIMARY KEY (id_esta)
);
-- ddl-end --
COMMENT ON TABLE "Pedidos"."Estado de la Orden" IS E'Estados de la Orden de DTF.';
-- ddl-end --
COMMENT ON COLUMN "Pedidos"."Estado de la Orden".id_esta IS E'id del estado';
-- ddl-end --
COMMENT ON COLUMN "Pedidos"."Estado de la Orden".nom_esta IS E'estado de la orden, Ej: Pendiente, Editado, Diseño Negado, Listo para Imprimir, Imprimiendo, Completado, Entregado.';
-- ddl-end --
ALTER TABLE "Pedidos"."Estado de la Orden" OWNER TO postgres;
-- ddl-end --

-- object: "Finanzas"."Factura" | type: TABLE --
-- DROP TABLE IF EXISTS "Finanzas"."Factura" CASCADE;
CREATE TABLE "Finanzas"."Factura" (
	id_fac integer NOT NULL,
	id_cli integer NOT NULL,
	id_esta integer NOT NULL,
	mont_fac numeric NOT NULL,
	fecc_fac timestamp NOT NULL,
	fece_fac timestamp NOT NULL,
	"id_oper_Operadores" integer,
	CONSTRAINT id_fac PRIMARY KEY (id_fac)
);
-- ddl-end --
COMMENT ON COLUMN "Finanzas"."Factura".id_fac IS E'id de la orden a realizar';
-- ddl-end --
COMMENT ON COLUMN "Finanzas"."Factura".id_cli IS E'id del cliente que solicito la impresion';
-- ddl-end --
COMMENT ON COLUMN "Finanzas"."Factura".fecc_fac IS E'Fecha de creacion del pedido';
-- ddl-end --
COMMENT ON COLUMN "Finanzas"."Factura".fece_fac IS E'fecha de entrega estimada para la impresion';
-- ddl-end --
ALTER TABLE "Finanzas"."Factura" OWNER TO postgres;
-- ddl-end --

-- object: "Pedidos"."Ordenes" | type: TABLE --
-- DROP TABLE IF EXISTS "Pedidos"."Ordenes" CASCADE;
CREATE TABLE "Pedidos"."Ordenes" (
	id_order integer NOT NULL,
	id_fac integer NOT NULL,
	id_tarif integer NOT NULL,
	larcm_order numeric NOT NULL,
	ancm_order numeric NOT NULL,
	can_order integer NOT NULL,
	sub_order numeric NOT NULL,
	CONSTRAINT id_order PRIMARY KEY (id_order)
);
-- ddl-end --
COMMENT ON TABLE "Pedidos"."Ordenes" IS E'Informacion detallada de cada impresion';
-- ddl-end --
COMMENT ON COLUMN "Pedidos"."Ordenes".id_order IS E'id de la orden general';
-- ddl-end --
COMMENT ON COLUMN "Pedidos"."Ordenes".id_fac IS E'id de la factura final';
-- ddl-end --
COMMENT ON COLUMN "Pedidos"."Ordenes".id_tarif IS E'id de la tarifa';
-- ddl-end --
COMMENT ON COLUMN "Pedidos"."Ordenes".larcm_order IS E'Largo en cm de la imagen';
-- ddl-end --
COMMENT ON COLUMN "Pedidos"."Ordenes".ancm_order IS E'ancho en cm de la imgen';
-- ddl-end --
COMMENT ON COLUMN "Pedidos"."Ordenes".can_order IS E'cantidad de copias a realizar del dicha imagen';
-- ddl-end --
COMMENT ON COLUMN "Pedidos"."Ordenes".sub_order IS E'sub total del monto de la impresion';
-- ddl-end --
ALTER TABLE "Pedidos"."Ordenes" OWNER TO postgres;
-- ddl-end --

-- object: "Finanzas"."Tarifas" | type: TABLE --
-- DROP TABLE IF EXISTS "Finanzas"."Tarifas" CASCADE;
CREATE TABLE "Finanzas"."Tarifas" (
	id_tarif integer NOT NULL,
	tam_tarif character varying(250) NOT NULL,
	pre_tarif numeric NOT NULL,
	CONSTRAINT id_tarif PRIMARY KEY (id_tarif)
);
-- ddl-end --
COMMENT ON TABLE "Finanzas"."Tarifas" IS E'Tarifas en favor al tamaño de la impresion';
-- ddl-end --
COMMENT ON COLUMN "Finanzas"."Tarifas".tam_tarif IS E'tamaño del pliego';
-- ddl-end --
COMMENT ON COLUMN "Finanzas"."Tarifas".pre_tarif IS E'precio de la impresion';
-- ddl-end --
ALTER TABLE "Finanzas"."Tarifas" OWNER TO postgres;
-- ddl-end --

-- object: "Personas"."Operadores" | type: TABLE --
-- DROP TABLE IF EXISTS "Personas"."Operadores" CASCADE;
CREATE TABLE "Personas"."Operadores" (
	id_oper integer NOT NULL,
	nom_oper character varying(250) NOT NULL,
	ced_oper character varying(50) NOT NULL,
	"id_user_Usuarios" integer,
	CONSTRAINT id_oper PRIMARY KEY (id_oper),
	CONSTRAINT "Operadores_uq" UNIQUE ("id_user_Usuarios")
);
-- ddl-end --
COMMENT ON TABLE "Personas"."Operadores" IS E'Empleados de la empresa';
-- ddl-end --
COMMENT ON COLUMN "Personas"."Operadores".id_oper IS E'id del operador';
-- ddl-end --
COMMENT ON COLUMN "Personas"."Operadores".nom_oper IS E'nombre del operador';
-- ddl-end --
COMMENT ON COLUMN "Personas"."Operadores".ced_oper IS E'cedula del operador';
-- ddl-end --
ALTER TABLE "Personas"."Operadores" OWNER TO postgres;
-- ddl-end --

-- object: "Personas"."Usuarios" | type: TABLE --
-- DROP TABLE IF EXISTS "Personas"."Usuarios" CASCADE;
CREATE TABLE "Personas"."Usuarios" (
	id_user integer NOT NULL,
	correo_user character varying(250) NOT NULL,
	hash_user character varying NOT NULL,
	id_rol integer NOT NULL,
	CONSTRAINT id_user PRIMARY KEY (id_user),
	CONSTRAINT correo_user UNIQUE (correo_user)
);
-- ddl-end --
COMMENT ON TABLE "Personas"."Usuarios" IS E'tabla de usuarios ejemplo: Clientes y Operadores';
-- ddl-end --
COMMENT ON COLUMN "Personas"."Usuarios".id_user IS E'identificador de cada usuario de la tabla';
-- ddl-end --
COMMENT ON COLUMN "Personas"."Usuarios".correo_user IS E'correo del usuario ejemplo: carloshernadez@gmail.com';
-- ddl-end --
COMMENT ON COLUMN "Personas"."Usuarios".hash_user IS E'contraseña en HASH del usuario';
-- ddl-end --
ALTER TABLE "Personas"."Usuarios" OWNER TO postgres;
-- ddl-end --

-- object: "Seguridad"."Roles" | type: TABLE --
-- DROP TABLE IF EXISTS "Seguridad"."Roles" CASCADE;
CREATE TABLE "Seguridad"."Roles" (
	id_rol integer NOT NULL,
	nom_rol character varying(150) NOT NULL,
	CONSTRAINT id_rol PRIMARY KEY (id_rol)
);
-- ddl-end --
COMMENT ON TABLE "Seguridad"."Roles" IS E'roles de usuario para determinar si es cliente, operador o admin.';
-- ddl-end --
COMMENT ON COLUMN "Seguridad"."Roles".id_rol IS E'identificador del rol';
-- ddl-end --
COMMENT ON COLUMN "Seguridad"."Roles".nom_rol IS E'nombre del rol ejemplo: operador, cliente, administrador.';
-- ddl-end --
ALTER TABLE "Seguridad"."Roles" OWNER TO postgres;
-- ddl-end --

-- object: public."Auditoria" | type: TABLE --
-- DROP TABLE IF EXISTS public."Auditoria" CASCADE;
CREATE TABLE public."Auditoria" (
	id_aud integer NOT NULL,
	id_user integer NOT NULL,
	action_aud character varying(100) NOT NULL,
	table_aud character varying(150) NOT NULL,
	regid_aud integer NOT NULL,
	prev_aud varchar(400),
	new_aud varchar(400),
	fec_aud timestamp NOT NULL,
	CONSTRAINT id_aud PRIMARY KEY (id_aud)
);
-- ddl-end --
COMMENT ON TABLE public."Auditoria" IS E'registro del historial de acciones';
-- ddl-end --
COMMENT ON COLUMN public."Auditoria".action_aud IS E'accion que realizo el usuario en ciestion';
-- ddl-end --
COMMENT ON COLUMN public."Auditoria".table_aud IS E'tabla la cuial fuese alterada';
-- ddl-end --
COMMENT ON COLUMN public."Auditoria".regid_aud IS E'Identificador de la facturau orden alterada';
-- ddl-end --
COMMENT ON COLUMN public."Auditoria".prev_aud IS E'datos previos de la tabla';
-- ddl-end --
COMMENT ON COLUMN public."Auditoria".new_aud IS E'datos nuevos de la tabla posterior a la modificacion';
-- ddl-end --
COMMENT ON COLUMN public."Auditoria".fec_aud IS E'fecha (y hora) de la accion';
-- ddl-end --
ALTER TABLE public."Auditoria" OWNER TO postgres;
-- ddl-end --

-- object: "Usuarios_fk" | type: CONSTRAINT --
-- ALTER TABLE "Personas"."Clientes" DROP CONSTRAINT IF EXISTS "Usuarios_fk" CASCADE;
ALTER TABLE "Personas"."Clientes" ADD CONSTRAINT "Usuarios_fk" FOREIGN KEY ("id_user_Usuarios")
REFERENCES "Personas"."Usuarios" (id_user) MATCH FULL
ON DELETE SET NULL ON UPDATE CASCADE;
-- ddl-end --

-- object: "Operadores_fk" | type: CONSTRAINT --
-- ALTER TABLE "Finanzas"."Factura" DROP CONSTRAINT IF EXISTS "Operadores_fk" CASCADE;
ALTER TABLE "Finanzas"."Factura" ADD CONSTRAINT "Operadores_fk" FOREIGN KEY ("id_oper_Operadores")
REFERENCES "Personas"."Operadores" (id_oper) MATCH FULL
ON DELETE SET NULL ON UPDATE CASCADE;
-- ddl-end --

-- object: id_cli | type: CONSTRAINT --
-- ALTER TABLE "Finanzas"."Factura" DROP CONSTRAINT IF EXISTS id_cli CASCADE;
ALTER TABLE "Finanzas"."Factura" ADD CONSTRAINT id_cli FOREIGN KEY (id_cli)
REFERENCES "Personas"."Clientes" (id_cli) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: id_esta | type: CONSTRAINT --
-- ALTER TABLE "Finanzas"."Factura" DROP CONSTRAINT IF EXISTS id_esta CASCADE;
ALTER TABLE "Finanzas"."Factura" ADD CONSTRAINT id_esta FOREIGN KEY (id_esta)
REFERENCES "Pedidos"."Estado de la Orden" (id_esta) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: id_fac | type: CONSTRAINT --
-- ALTER TABLE "Pedidos"."Ordenes" DROP CONSTRAINT IF EXISTS id_fac CASCADE;
ALTER TABLE "Pedidos"."Ordenes" ADD CONSTRAINT id_fac FOREIGN KEY (id_fac)
REFERENCES "Finanzas"."Factura" (id_fac) MATCH FULL
ON DELETE RESTRICT ON UPDATE CASCADE;
-- ddl-end --

-- object: id_tarif | type: CONSTRAINT --
-- ALTER TABLE "Pedidos"."Ordenes" DROP CONSTRAINT IF EXISTS id_tarif CASCADE;
ALTER TABLE "Pedidos"."Ordenes" ADD CONSTRAINT id_tarif FOREIGN KEY (id_tarif)
REFERENCES "Finanzas"."Tarifas" (id_tarif) MATCH FULL
ON DELETE RESTRICT ON UPDATE CASCADE;
-- ddl-end --

-- object: "Usuarios_fk" | type: CONSTRAINT --
-- ALTER TABLE "Personas"."Operadores" DROP CONSTRAINT IF EXISTS "Usuarios_fk" CASCADE;
ALTER TABLE "Personas"."Operadores" ADD CONSTRAINT "Usuarios_fk" FOREIGN KEY ("id_user_Usuarios")
REFERENCES "Personas"."Usuarios" (id_user) MATCH FULL
ON DELETE SET NULL ON UPDATE CASCADE;
-- ddl-end --

-- object: id_rol | type: CONSTRAINT --
-- ALTER TABLE "Personas"."Usuarios" DROP CONSTRAINT IF EXISTS id_rol CASCADE;
ALTER TABLE "Personas"."Usuarios" ADD CONSTRAINT id_rol FOREIGN KEY (id_rol)
REFERENCES "Seguridad"."Roles" (id_rol) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: id_user | type: CONSTRAINT --
-- ALTER TABLE public."Auditoria" DROP CONSTRAINT IF EXISTS id_user CASCADE;
ALTER TABLE public."Auditoria" ADD CONSTRAINT id_user FOREIGN KEY (id_user)
REFERENCES "Personas"."Usuarios" (id_user) MATCH FULL
ON DELETE RESTRICT ON UPDATE CASCADE;
-- ddl-end --


