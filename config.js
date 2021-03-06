//TellefileStorage --> LocalStorage, ChromeStorage, Cache

Config = window.Config || {};
Config.CountryCodes = [["AB","country_select_modal_country_ab","+7 840","+7 940","+995 44"],["AF","country_select_modal_country_af","+93"],["AX","country_select_modal_country_ax","+358 18"],["AL","country_select_modal_country_al","+355"],["DZ","country_select_modal_country_dz","+213"],["AS","country_select_modal_country_as","+1 684"],["AD","country_select_modal_country_ad","+376"],["AO","country_select_modal_country_ao","+244"],["AI","country_select_modal_country_ai","+1 264"],["AG","country_select_modal_country_ag","+1 268"],["AR","country_select_modal_country_ar","+54"],["AM","country_select_modal_country_am","+374"],["AW","country_select_modal_country_aw","+297"],["SH","country_select_modal_country_sh_ac","+247"],["AU","country_select_modal_country_au","+61"],["AU","country_select_modal_country_au_et","+672"],["AT","country_select_modal_country_at","+43"],["AZ","country_select_modal_country_az","+994"],["BS","country_select_modal_country_bs","+1 242"],["BH","country_select_modal_country_bh","+973"],["BD","country_select_modal_country_bd","+880"],["BB","country_select_modal_country_bb","+1 246"],["AG","country_select_modal_country_ag_bar","+1 268"],["BY","country_select_modal_country_by","+375"],["BE","country_select_modal_country_be","+32"],["BZ","country_select_modal_country_bz","+501"],["BJ","country_select_modal_country_bj","+229"],["BM","country_select_modal_country_bm","+1 441"],["BT","country_select_modal_country_bt","+975"],["BO","country_select_modal_country_bo","+591"],["BQ","country_select_modal_country_bq","+599 7"],["BA","country_select_modal_country_ba","+387"],["BW","country_select_modal_country_bw","+267"],["BR","country_select_modal_country_br","+55"],["IO","country_select_modal_country_io","+246"],["VG","country_select_modal_country_vg","+1 284"],["BN","country_select_modal_country_bn","+673"],["BG","country_select_modal_country_bg","+359"],["BF","country_select_modal_country_bf","+226"],["MY","country_select_modal_country_mm","+95"],["BI","country_select_modal_country_bi","+257"],["KH","country_select_modal_country_kh","+855"],["CM","country_select_modal_country_cm","+237"],["CA","country_select_modal_country_ca","+1"],["CV","country_select_modal_country_cv","+238"],["KY","country_select_modal_country_ky","+1 345"],["CF","country_select_modal_country_cf","+236"],["TD","country_select_modal_country_td","+235"],["CL","country_select_modal_country_cl","+56"],["CN","country_select_modal_country_cn","+86"],["CX","country_select_modal_country_cx","+61"],["CC","country_select_modal_country_cc","+61"],["CO","country_select_modal_country_co","+57"],["KM","country_select_modal_country_km","+269"],["CG","country_select_modal_country_cg","+242"],["CD","country_select_modal_country_cd","+243"],["CK","country_select_modal_country_ck","+682"],["CR","country_select_modal_country_cr","+506"],["CI","country_select_modal_country_ci","+225"],["HR","country_select_modal_country_hr","+385"],["CU","country_select_modal_country_cu","+53"],["CW","country_select_modal_country_cw","+599 9"],["CY","country_select_modal_country_cy","+357"],["CZ","country_select_modal_country_cz","+420"],["DK","country_select_modal_country_dk","+45"],["DG","country_select_modal_country_dg","+246"],["DJ","country_select_modal_country_dj","+253"],["DM","country_select_modal_country_dm","+1 767"],["DO","country_select_modal_country_do","+1 809","+1 829","+1 849"],["TL","country_select_modal_country_tl","+670"],["EC","country_select_modal_country_ec","+593"],["EG","country_select_modal_country_eg","+20"],["SV","country_select_modal_country_sv","+503"],["GQ","country_select_modal_country_gq","+240"],["ER","country_select_modal_country_er","+291"],["EE","country_select_modal_country_ee","+372"],["ET","country_select_modal_country_et","+251"],["FK","country_select_modal_country_fk","+500"],["FO","country_select_modal_country_fo","+298"],["FJ","country_select_modal_country_fj","+679"],["FI","country_select_modal_country_fi","+358"],["FR","country_select_modal_country_fr","+33"],["GF","country_select_modal_country_gf","+594"],["PF","country_select_modal_country_pf","+689"],["GA","country_select_modal_country_ga","+241"],["GM","country_select_modal_country_gm","+220"],["GE","country_select_modal_country_ge","+995"],["DE","country_select_modal_country_de","+49"],["GH","country_select_modal_country_gh","+233"],["GI","country_select_modal_country_gi","+350"],["GR","country_select_modal_country_gr","+30"],["GL","country_select_modal_country_gl","+299"],["GD","country_select_modal_country_gd","+1 473"],["GP","country_select_modal_country_gp","+590"],["GU","country_select_modal_country_gu","+1 671"],["GT","country_select_modal_country_gt","+502"],["GG","country_select_modal_country_gg","+44"],["GN","country_select_modal_country_gn","+224"],["GW","country_select_modal_country_gw","+245"],["GY","country_select_modal_country_gy","+592"],["HT","country_select_modal_country_ht","+509"],["HN","country_select_modal_country_hn","+504"],["HK","country_select_modal_country_hk","+852"],["HU","country_select_modal_country_hu","+36"],["IS","country_select_modal_country_is","+354"],["IN","country_select_modal_country_in","+91"],["ID","country_select_modal_country_id","+62"],["IR","country_select_modal_country_ir","+98"],["IQ","country_select_modal_country_iq","+964"],["IE","country_select_modal_country_ie","+353"],["IL","country_select_modal_country_il","+972"],["IT","country_select_modal_country_it","+39"],["JM","country_select_modal_country_jm","+1 876"],["SJ","country_select_modal_country_sj","+47 79"],["JP","country_select_modal_country_jp","+81"],["JE","country_select_modal_country_je","+44"],["JO","country_select_modal_country_jo","+962"],["KZ","country_select_modal_country_kz","+7 6","+7 7"],["KE","country_select_modal_country_ke","+254"],["KI","country_select_modal_country_ki","+686"],["KP","country_select_modal_country_kp","+850"],["KR","country_select_modal_country_kr","+82"],["KW","country_select_modal_country_kw","+965"],["KG","country_select_modal_country_kg","+996"],["LA","country_select_modal_country_la","+856"],["LV","country_select_modal_country_lv","+371"],["LB","country_select_modal_country_lb","+961"],["LS","country_select_modal_country_ls","+266"],["LR","country_select_modal_country_lr","+231"],["LY","country_select_modal_country_ly","+218"],["LI","country_select_modal_country_li","+423"],["LT","country_select_modal_country_lt","+370"],["LU","country_select_modal_country_lu","+352"],["MO","country_select_modal_country_mo","+853"],["MK","country_select_modal_country_mk","+389"],["MG","country_select_modal_country_mg","+261"],["MW","country_select_modal_country_mw","+265"],["MY","country_select_modal_country_my","+60"],["MV","country_select_modal_country_mv","+960"],["ML","country_select_modal_country_ml","+223"],["MT","country_select_modal_country_mt","+356"],["MH","country_select_modal_country_mh","+692"],["MQ","country_select_modal_country_mq","+596"],["MR","country_select_modal_country_mr","+222"],["MU","country_select_modal_country_mu","+230"],["YT","country_select_modal_country_yt","+262"],["MX","country_select_modal_country_mx","+52"],["FM","country_select_modal_country_fm","+691"],["MD","country_select_modal_country_md","+373"],["MC","country_select_modal_country_mc","+377"],["MN","country_select_modal_country_mn","+976"],["ME","country_select_modal_country_me","+382"],["MS","country_select_modal_country_ms","+1 664"],["MA","country_select_modal_country_ma","+212"],["MZ","country_select_modal_country_mz","+258"],["NA","country_select_modal_country_na","+264"],["NR","country_select_modal_country_nr","+674"],["NP","country_select_modal_country_np","+977"],["NL","country_select_modal_country_nl","+31"],["NC","country_select_modal_country_nc","+687"],["NZ","country_select_modal_country_nz","+64"],["NI","country_select_modal_country_ni","+505"],["NE","country_select_modal_country_ne","+227"],["NG","country_select_modal_country_ng","+234"],["NU","country_select_modal_country_nu","+683"],["NF","country_select_modal_country_nf","+672"],["MP","country_select_modal_country_mp","+1 670"],["NO","country_select_modal_country_no","+47"],["OM","country_select_modal_country_om","+968"],["PK","country_select_modal_country_pk","+92"],["PW","country_select_modal_country_pw","+680"],["PS","country_select_modal_country_ps","+970"],["PA","country_select_modal_country_pa","+507"],["PG","country_select_modal_country_pg","+675"],["PY","country_select_modal_country_py","+595"],["PE","country_select_modal_country_pe","+51"],["PH","country_select_modal_country_ph","+63"],["PN","country_select_modal_country_pn","+64"],["PL","country_select_modal_country_pl","+48"],["PT","country_select_modal_country_pt","+351"],["PR","country_select_modal_country_pr","+1 787","+1 939"],["QA","country_select_modal_country_qa","+974"],["RE","country_select_modal_country_re","+262"],["RO","country_select_modal_country_ro","+40"],["RU","country_select_modal_country_ru","+7"],["RW","country_select_modal_country_rw","+250"],["BL","country_select_modal_country_bl","+590"],["SH","country_select_modal_country_sh","+290"],["KN","country_select_modal_country_kn","+1 869"],["LC","country_select_modal_country_lc","+1 758"],["MF","country_select_modal_country_mf","+590"],["PM","country_select_modal_country_pm","+508"],["VC","country_select_modal_country_vc","+1 784"],["WS","country_select_modal_country_ws","+685"],["SM","country_select_modal_country_sm","+378"],["ST","country_select_modal_country_st","+239"],["SA","country_select_modal_country_sa","+966"],["SN","country_select_modal_country_sn","+221"],["RS","country_select_modal_country_rs","+381"],["SC","country_select_modal_country_sc","+248"],["SL","country_select_modal_country_sl","+232"],["SG","country_select_modal_country_sg","+65"],["BQ","country_select_modal_country_nl_bq3","+599 3"],["SX","country_select_modal_country_sx","+1 721"],["SK","country_select_modal_country_sk","+421"],["SI","country_select_modal_country_si","+386"],["SB","country_select_modal_country_sb","+677"],["SO","country_select_modal_country_so","+252"],["ZA","country_select_modal_country_za","+27"],["GS","country_select_modal_country_gs","+500"],[false,"country_select_modal_country_ge_so","+995 34"],["SS","country_select_modal_country_ss","+211"],["ES","country_select_modal_country_es","+34"],["LK","country_select_modal_country_lk","+94"],["SD","country_select_modal_country_sd","+249"],["SR","country_select_modal_country_sr","+597"],["SJ","country_select_modal_country_sj_no","+47 79"],["SZ","country_select_modal_country_sz","+268"],["SE","country_select_modal_country_se","+46"],["CH","country_select_modal_country_ch","+41"],["SY","country_select_modal_country_sy","+963"],["TW","country_select_modal_country_tw","+886"],["TJ","country_select_modal_country_tj","+992"],["TZ","country_select_modal_country_tz","+255"],["TH","country_select_modal_country_th","+66"],["TG","country_select_modal_country_tg","+228"],["TK","country_select_modal_country_tk","+690"],["TO","country_select_modal_country_to","+676"],["TT","country_select_modal_country_tt","+1 868"],["TN","country_select_modal_country_tn","+216"],["TR","country_select_modal_country_tr","+90"],["TM","country_select_modal_country_tm","+993"],["TC","country_select_modal_country_tc","+1 649"],["TV","country_select_modal_country_tv","+688"],["UG","country_select_modal_country_ug","+256"],["UA","country_select_modal_country_ua","+380"],["AE","country_select_modal_country_ae","+971"],["UK","country_select_modal_country_uk","+44"],["US","country_select_modal_country_us","+1"],["UY","country_select_modal_country_uy","+598"],["VI","country_select_modal_country_vi","+1 340"],["UZ","country_select_modal_country_uz","+998"],["VU","country_select_modal_country_vu","+678"],["VE","country_select_modal_country_ve","+58"],["VA","country_select_modal_country_va","+39 06 698","+379"],["VN","country_select_modal_country_vn","+84"],["WF","country_select_modal_country_wf","+681"],["YE","country_select_modal_country_ye","+967"],["ZM","country_select_modal_country_zm","+260"],[false,"country_select_modal_country_tz_uk","+255"],["ZW","country_select_modal_country_zw","+263"]];
Config.App = {
	id : 1,
	hash : '8da85b0d5bfe62527e5b244c209159c3'
};

Config.Modes = {
	debug : true
};

Config.I18n = {
  locale: 'en-us',
  supported: [
    "en-us" 
    ,"es-es"
    ,"de-de"
    ,"it-it"
    ,"nl-nl"
    ,"pt-br"
    // ,"ru-ru"
  ], // To be copied to package.json
  languages: {
    'en-us': 'English',
    'de-de': 'Deutsch',
    'es-es': 'Español',
    'it-it': 'Italiano',
    'ru-ru': 'Русский',
    'nl-nl': 'Nederlands',
    'pt-br': 'Português (Brazil)'
  },
  aliases: {
    'en': 'en-us',
    'de': 'de-de',
    'es': 'es-es',
    'it': 'it-it',
    'ru': 'ru-ru',
    'nl': 'nl-nl'
  },
  messages: {},
  fallback_messages: {}
};

Config.Schema = Config.Schema || {};

Config.Schema.Protocol = {
	"constructors":[
	{"id":"7401417","predicate":"vector","params":[],"type":"Vector t"},
	{ "id":"3536456","predicate":"resPQ",
	  "params":[ 
	  {"name":"nonce","type":"int128"},{"name":"server_nonce","type":"int128"},
	  {"name":"pq","type":"bytes"},{"name":"server_public_key_fingerprints","type":"Vector<long>"}
	  ],
	  "type":"ResPQ"
	},
	{ "id":"-6526543","predicate":"p_q_inner_data",
	  "params":[
	    {"name":"pq","type":"bytes"},{"name":"p","type":"bytes"},{"name":"q","type":"bytes"},
	    {"name":"nonce","type":"int128"},{"name":"server_nonce","type":"int128"},
	    {"name":"new_nonce","type":"int256"}
	  ],
	  "type":"P_Q_inner_data"
	},
	{ "id":"3463681","predicate":"server_DH_params_fail","params":[
	  {"name":"nonce","type":"int128"},{"name":"server_nonce","type":"int128"},
	  {"name":"new_nonce_hash","type":"int128"}],
	  "type":"Server_DH_Params"},
	{ "id":"-5032428","predicate":"server_DH_params_ok",
	  "params":[
	    {"name":"nonce","type":"int128"},{"name":"server_nonce","type":"int128"},
	    {"name":"encrypted_answer","type":"bytes"}
	  ],"type":"Server_DH_Params"},
	{ "id":"-2598352","predicate":"server_DH_inner_data",
	  "params":[
	    {"name":"nonce","type":"int128"},{"name":"server_nonce","type":"int128"},
	    {"name":"g","type":"int"},{"name":"dh_prime","type":"bytes"},
	    {"name":"g_a","type":"bytes"},{"name":"server_time","type":"int"}
	  ],"type":"Server_DH_inner_data"},
	{ "id":"5551332","predicate":"client_DH_inner_data",
	  "params":[{"name":"nonce","type":"int128"},{"name":"server_nonce","type":"int128"},
	            {"name":"retry_id","type":"long"},{"name":"g_b","type":"bytes"}],
	  "type":"Client_DH_Inner_Data"},
	{ "id":"3249906","predicate":"dh_gen_ok",
	  "params":[{"name":"nonce","type":"int128"},{"name":"server_nonce","type":"int128"},
	            {"name":"new_nonce_hash1","type":"int128"}],
		  "type":"Set_client_DH_params_answer"},
	{ "id":"7542429","predicate":"dh_gen_retry",
	  "params":[{"name":"nonce","type":"int128"},{"name":"server_nonce","type":"int128"},
	            {"name":"new_nonce_hash2","type":"int128"}],
	  "type":"Set_client_DH_params_answer"},
	{ "id":"-6877536","predicate":"dh_gen_fail",
	  "params":[{"name":"nonce","type":"int128"},{"name":"server_nonce","type":"int128"},
	            {"name":"new_nonce_hash3","type":"int128"}],
	  "type":"Set_client_DH_params_answer"},
	{ "id":"-5152079","predicate":"rpc_result",
	  "params":[{"name":"request_msg_id","type":"long"},{"name":"result","type":"Object"}],
	  "type":"RpcResult"}
	],
	"methods":[{"id":"1989060","method":"request_pq", "params":[{"name":"nonce", "type":"int128"}]},{"id":"5576337","method":"request_DH_params","params":[ {"name":"nonce","type":"int128"},{"name":"server_nonce", "type":"int128"},{"name":"p","type":"bytes"},{"name":"q","type":"bytes"},{"name":"public_key_fingerprint","type":"long"},{"name":"encrypted_data","type":"bytes"}],"type":"Server_DH_Params"},{"id":"8293404","method":"set_client_DH_params","params":[ {"name":"nonce","type":"int128"},{"name":"server_nonce","type":"int128"},{"name":"encrypted_data","type":"bytes"}],"type":"Set_Client_DH_Params_Answer"},{"id":"4165479", "method":"rpc_drop_answer","params":[{"name":"request_msg_id", "type":"long"}],"type":"RpcDropAnswer" },{"id":"3698337", "method":"get_future_salts","params":[{"name":"num","type":"int"}],"type":"FutureSalts"},{"id":"3263086","method":"ping","params":[{"name":"ping_id","type":"long"}],"type":"Ping"},{"id":"2947572","method":"ping_delay_disconnect","params":[{"name":"ping_id","type":"long"},{"name":"disconnect_delay","type":"int"}]},{"id":"5399755","method":"destroy_session","params":[{"name":"session_id","type":"long"}],"type":"DestroySession"},{"id":"3205367","method":"http_wait","params":[{"name":"max_delay","type":"int"},{"name":"wait_after","type":"int"},{"name":"max_wait","type":"int"}],"type":"HttpWait"}]
};

