/*==============================================================*/
/* DBMS name:      MySQL 5.0                                    */
/* Created on:     10/9/2026 9:43:37 AM                         */
/*==============================================================*/


drop table if exists BAHAN;

drop table if exists FAVORIT;

drop table if exists KATEGORI;

drop table if exists KOMENTAR;

drop table if exists RATING;

drop table if exists RESEP;

drop table if exists RESEP_BAHAN;

drop table if exists USER;

/*==============================================================*/
/* Table: BAHAN                                                 */
/*==============================================================*/
create table BAHAN
(
   ID_BAHAN             int not null,
   NAMA_BAHAN           varchar(100),
   primary key (ID_BAHAN)
);

/*==============================================================*/
/* Table: FAVORIT                                               */
/*==============================================================*/
create table FAVORIT
(
   ID_FAVORIT           int not null,
   ID_USER              int,
   ID_RESEP             int,
   TANGGAL_FAVORIT      datetime,
   primary key (ID_FAVORIT)
);

/*==============================================================*/
/* Table: KATEGORI                                              */
/*==============================================================*/
create table KATEGORI
(
   ID_KATEGORI          int not null,
   NAMA_KATEGORI        varchar(100),
   primary key (ID_KATEGORI)
);

/*==============================================================*/
/* Table: KOMENTAR                                              */
/*==============================================================*/
create table KOMENTAR
(
   ID_KOMENTAR          int not null,
   ID_USER              int,
   ID_RESEP             int,
   TEKS_KOMENTAR        text,
   TANGGAL_KOMENTAR     datetime,
   primary key (ID_KOMENTAR)
);

/*==============================================================*/
/* Table: RATING                                                */
/*==============================================================*/
create table RATING
(
   ID_RATING            int not null,
   ID_USER              int,
   ID_RESEP             int,
   SKOR_RATING          int,
   TANGGAL_RATING       datetime,
   primary key (ID_RATING)
);

/*==============================================================*/
/* Table: RESEP                                                 */
/*==============================================================*/
create table RESEP
(
   ID_RESEP             int not null,
   ID_USER              int,
   ID_KATEGORI          int,
   NAMA_RESEP           varchar(150),
   LANGKAH              text,
   FOTO                 varchar(255),
   TANGGAL_DIBUAT       datetime,
   primary key (ID_RESEP)
);

/*==============================================================*/
/* Table: RESEP_BAHAN                                           */
/*==============================================================*/
create table RESEP_BAHAN
(
   ID_RESEP_BAHAN       int not null,
   ID_RESEP             int,
   ID_BAHAN             int,
   JUMLAH               decimal(15,5),
   SATUAN               varchar(30),
   primary key (ID_RESEP_BAHAN)
);

/*==============================================================*/
/* Table: USER                                                  */
/*==============================================================*/
create table USER
(
   ID_USER              int not null,
   NAMA_                varchar(100),
   EMAIL_               varchar(100) not null,
   PASSWORD_            varchar(255),
   TANGGAL_DAFTAR       datetime,
   primary key (ID_USER),
   key AK_AK_EMAIL (EMAIL_)
);

alter table FAVORIT add constraint FK_DISIMPAN_SEBAGAI_FAVORIT foreign key (ID_RESEP)
      references RESEP (ID_RESEP) on delete restrict on update restrict;

alter table FAVORIT add constraint FK_MENYIMPAN_FAVORIT foreign key (ID_USER)
      references USER (ID_USER) on delete restrict on update restrict;

alter table KOMENTAR add constraint FK_MEMBERIKAN_KOMENTAR foreign key (ID_USER)
      references USER (ID_USER) on delete restrict on update restrict;

alter table KOMENTAR add constraint FK_MEMILIKI_KOMENTAR foreign key (ID_RESEP)
      references RESEP (ID_RESEP) on delete restrict on update restrict;

alter table RATING add constraint FK_MEMBERIKAN_RATING foreign key (ID_USER)
      references USER (ID_USER) on delete restrict on update restrict;

alter table RATING add constraint FK_MENERIMA_RATING foreign key (ID_RESEP)
      references RESEP (ID_RESEP) on delete restrict on update restrict;

alter table RESEP add constraint FK_MEMILIKI foreign key (ID_KATEGORI)
      references KATEGORI (ID_KATEGORI) on delete restrict on update restrict;

alter table RESEP add constraint FK_MENGUNGGAH foreign key (ID_USER)
      references USER (ID_USER) on delete restrict on update restrict;

alter table RESEP_BAHAN add constraint FK_MEMILIKI_BAHAN foreign key (ID_BAHAN)
      references BAHAN (ID_BAHAN) on delete restrict on update restrict;

alter table RESEP_BAHAN add constraint FK_RELATIONSHIP_3 foreign key (ID_RESEP)
      references RESEP (ID_RESEP) on delete restrict on update restrict;

