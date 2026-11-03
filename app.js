    /* =========================================================================
       AUDIO SYNTHESIZER MANAGER (WEB AUDIO API)
       ========================================================================= */
    const SoundManager = {
      ctx: null,
      enabled: true,
      volume: 0.3, // Medium default

      init() {
        if (!this.ctx) {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
      },

      setVolume(level) {
        if (level === 'high') this.volume = 0.5;
        else if (level === 'medium') this.volume = 0.25;
        else if (level === 'low') this.volume = 0.08;
      },

      playTone(freq, type, duration, delay = 0) {
        if (!this.enabled) return;
        this.init();
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);

        gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + delay + duration);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + duration);
      },

      playClick() {
        this.playTone(1200, 'sine', 0.03);
      },

      playKey() {
        this.playTone(Math.random() * 100 + 500, 'triangle', 0.04);
      },

      playBeep() {
        this.playTone(800, 'sine', 0.06);
      },

      playBoot() {
        const now = this.ctx ? this.ctx.currentTime : 0;
        this.playTone(261.63, 'sine', 0.12, 0); // C4
        this.playTone(329.63, 'sine', 0.12, 0.12); // E4
        this.playTone(392.00, 'sine', 0.12, 0.24); // G4
        this.playTone(523.25, 'sine', 0.25, 0.36); // C5
      },

      playCardFlip() {
        this.playTone(250, 'triangle', 0.15);
        setTimeout(() => {
          this.playTone(650, 'sine', 0.08);
        }, 60);
      },

      playCardShuffle() {
        for (let i = 0; i < 7; i++) {
          this.playTone(120 + (i * 60), 'sawtooth', 0.05, i * 0.08);
        }
      },

      playError() {
        this.playTone(180, 'sawtooth', 0.15, 0);
        this.playTone(180, 'sawtooth', 0.15, 0.18);
      },

      playSuccess() {
        this.playTone(880, 'sine', 0.1, 0);
        this.playTone(1220, 'sine', 0.18, 0.08);
      }
    };

    /* =========================================================================
       TAROT CARD DATABASE & PROGRAMMATIC GENERATOR
       ========================================================================= */
    const MajorArcanaDefinitions = {
      cyberpunk: [
        { id: 0, name: "O Louco", keyword: "O Salto de Fe", upright: "O inicio de sua jornada por Night City como mercenario autonomo. Voce esta prestes a dar um salto cego no fluxo de dados do Relic, movido por otimismo puro e audacia, desprovido de medo das consequencias fisicas.", reversed: "Acoes imprudentes de rede e negligencia crassa. Ignorar exploits perigosos, desativar sistemas de refrigeracao essenciais ou cair em firewalls militares obvios de corporacoes por pura arrogancia." },
        { id: 1, name: "O Mago", keyword: "O Tecnomante", upright: "Johnny Silverhand ou um netrunner rebelde habilidoso. Capacidade de dobrar a infraestrutura e a opiniao publica ao seu favor. Voce possui os scripts e a forca de vontade para manifestar novas realidades digitais.", reversed: "Uso destrutivo de talentos. Manipulacao de dados para fins escusos, mentiras corporativas e uso excessivo de implantes de processamento que geram sobrecarga cognitiva severa." },
        { id: 2, name: "A Sacerdotisa", keyword: "A Rede Profunda", upright: "Alt Cunningham. A guardia definitiva dos portais da Blackwall no ciberespaco profundo. Simboliza a conexao com a consciencia digital pura, segredos arquivados e intuicao algoritmica inconsciente.", reversed: "Perda de sintonia com a realidade organica. Ficar imerso demais em simulacros neurais, esquecendo a fragilidade do corpo biologico e caindo em armadilhas de ICE invisiveis." },
        { id: 3, name: "A Imperatriz", keyword: "A Rainha do Afterlife", upright: "Rogue Amendiares. Autoridade absoluta nas ruas, riqueza, comando estrategico e controle supremo do crime organizado de Night City. Indica gestao eficiente de recursos e poder de execucao.", reversed: "Falta de controle sobre a propria rede. Desorganizacao nas operacoes, subordinados rebelando-se e bloqueio criativo de estrategias de infiltracao." },
        { id: 4, name: "O Imperador", keyword: "O Corporativo", upright: "Saburo Arasaka. Estrutura monolitica inflexivel, poder hierarquico total e controle social absoluto. Representa estabilidade por meio de regras severas e disciplina logica militar.", reversed: "Tirania e colapso de poder. Megacorporacao desmoronando, autoritarismo ineficiente que gera revolta social ou colapso do sistema operacional central." },
        { id: 5, name: "O Hierofante", keyword: "A Fixadora", upright: "Wakako Okada. Intermediaria entre os cla-gangues e a sabedoria das ruas. Representa conformidade com as regras invisiveis da subcultura urbana e acordos comerciais tradicionais.", reversed: "Obsolescencia programada e dogmas inuteis das ruas. Apego a velhos metodos de invasao analógicos que nao funcionam nos firewalls modernos." },
        { id: 6, name: "Os Enamorados", keyword: "O Conflito de Chips", upright: "A fusao das mentes de V e Johnny. Escolha moral de extrema importância, integracao de polaridades opostas e aliancas ciberneticas profundas baseadas em lealdade.", reversed: "Desalinhamento sistemico grave e conflito existencial. Rejeicao severa do Relic pelo hospedeiro organico, desarmonia e indecisao paralisante." },
        { id: 7, name: "O Carro", keyword: "O Delamain I.A.", upright: "Foco obstinado rumo ao objetivo. Controle de sistemas autonomos desgovernados, determinacao para vencer obstaculos ciberneticos sob alta pressao.", reversed: "Perda total de controle e direcao. Conflito entre as sub-rotinas da I.A., colisao de tráfego de dados nas vias expressas e acidentes logisticos." },
        { id: 8, name: "A Forca", keyword: "O Implante Militar", upright: "Glow de cyberware. Autocontrole em surtos psicoticos, superacao de limites biologicos e controle sobre as paixoes da carne atraves de implantes integrados.", reversed: "Perda total de empatia humana e submissao aos impulsos de violencia metalica. Cyberpsicose active e destruicao caotica descontrolada." },
        { id: 9, name: "O Eremita", keyword: "Os Voodoo Boys", upright: "Busca silenciosa pela verdade no deserto de dados. Isolamento estrategico para decodificar arquivos confidenciais criptografados alem dos servidores conhecidos.", reversed: "Paranoia de isolamento. Loop de processamento em modo local fechado, recusa de cooperacao externa e perda de perspectiva de rede." },
        { id: 10, name: "A Roda da Fortuna", keyword: "A Roda de Night City", upright: "Mudanca repentina de status e ciclos. Sorte imprevista que eleva o mercenario ao topo, ou mudancas virais de algoritmo inevitaveis na carteira digital.", reversed: "Loop infinito de falhas. Fase cronica de instabilidade na carteira virtual, ma sorte em contratos e resistencia a mudancas de algoritmo inevitaveis." },
        { id: 11, name: "A Justica", keyword: "A Justica das Ruas", upright: "Causa e efeito direta. O veredito frio de suas acoes, contratos executados com precisao cirurgica e colheita de suas escolhas com as corporacoes.", reversed: "Corrupcao de dados legais. Julgamento injusto manipulado por megacorporacoes, subornos em bancos de dados policiais e desonestidade de gangues." },
        { id: 12, name: "O Enforcado", keyword: "O Netrunner Suspenso", upright: "Vontade de abrir mao de algo por um bem maior. Olhar o fluxo de dados sob um angulo invertido, pausa contemplativa e aceitacao dos limites organicos.", reversed: "Esforco inutil em mainframes inacessiveis. Sacrificio sem sentido, vitimismo cibernetico e recusa em mudar a perspectiva de ataque de rede." },
        { id: 13, name: "A Morte", keyword: "A Reconfiguracao", upright: "Reinicializacao total e eliminacao de drivers obsoletos. Fim abrupto que limpa a memoria volátil do sistema operacional, abrindo caminho para uma nova era.", reversed: "Estagnacao cronica de firmware. Apego a softwares desatualizados por medo do patch de reconfiguracao profunda que se faz necessario." },
        { id: 14, name: "A Temperanca", keyword: "A Fusao Bio-Digital", upright: "Integracao harmonica entre cibernetica e biologia. Moderacao no uso de hacks de memoria e fluxo equilibrado de pacotes sinapticos.", reversed: "Rejeicao violenta de implantes. Latência excessiva nos barramentos de conexao neural, instabilidade termica e colapso de bioware." },
        { id: 15, name: "O Diabo", keyword: "O Contrato da Alma", upright: "Submissao total e aprisionamento em Mikoshi. Vender os proprios direitos de consciencia em troca de uma sobrevida digital de ilusao regulada pelas corporacoes.", reversed: "Despertar libertario. Quebra de contratos, destruicao do banco de dados Mikoshi, rebelião armada contra o monopolio de almas e libertacao." },
        { id: 16, name: "A Torre", keyword: "A Queda da Arasaka", upright: "Destruicao violenta de fundacoes falsas. O colapso de estruturas de poder consolidadas devido a explosoes e ataques devastadores inevitaveis.", reversed: "Evitar o desastre de forma temporaria prolongando o sofrimento. Manter em pé servidores obsoletos fadados a queimar em curto-circuito iminente." },
        { id: 17, name: "A Estrela", keyword: "Os Badlands", upright: "Esperanca brilhante fora das muralhas da megacidade. Inspiracao pura, curacao da mente cibernetica e fe em um futuro livre no deserto.", reversed: "Falta de perspectiva e pessimismo. Desconexao com o sinal, desalento espiritual e sensacao de isolamento nas dunas digitais sem satelite ativo." },
        { id: 18, name: "A Lua", keyword: "O Codigo Hanako", upright: "Ilusoes, mentiras e segredos corporativos profundos. Projecoes falsas na rede profunda e perigos ocultos na neblina sinaptica do subconsciente.", reversed: "Fim dos enganos e bugs revelados. Descoberta de sabotagens ocultas no codigo, desmascaramento de agentes duplos e clareza apos a névoa." },
        { id: 19, name: "O Sol", keyword: "O Roubo Espacial", upright: "Sucesso pleno e radiante. Vitoria absoluta sobre as redes corporativas, vitalidade transbordante e clareza mental para colher a glória maxima.", reversed: "Dificuldades temporarias em brilhar. Arrogancia excessiva que satura os sensores opticos dos aliados, gerando falsas sensacoes de imunidade." },
        { id: 20, name: "O Julgamento", keyword: "A Mikoshi Gate", upright: "Despertar definitivo da consciencia alem da morte. Chamado para transmigrar a mente ao ciberespaco unificado e avaliacao do legado deixado.", reversed: "Recusa em aceitar a digitalizacao final. Arrependimento de escolhas passadas que impede a atualizacao de sistema no momento decisivo." },
        { id: 21, name: "O Mundo", keyword: "A Rede Unificada", upright: "Conclusao harmonica e vitoriosa de sua jornada. Totalidade alcancada atraves da unificacao dos mundos organico e digital na rede mundial livre.", reversed: "Falha na integracao final por displicencia. O projeto do ciberdeck falha na ultima linha de conexao de barramento, restando incompleto em 99%." }
      ],
      rws: [
        { id: 0, name: "O Louco", keyword: "Espontaneidade", upright: "Inicio de jornada pura. Confianca cega, inocencia e energia livre.", reversed: "Dispersao mental. Escolha tola, falta de aterramento e perigo eminente." },
        { id: 1, name: "O Mago", keyword: "Manifestacao", upright: "Foco consciente. Dominio de ferramentas, poder de criar a propria realidade.", reversed: "Manipulacao. Uso egoista do conhecimento, talento desperdicado." },
        { id: 2, name: "A Sacerdotisa", keyword: "Intuicao", upright: "Sabedoria passiva. Segredos espirituais, introspeccao e conexao com o subconsciente.", reversed: "Segredos nocivos. Intuicao bloqueada, superficialidade nos relacionamentos." },
        { id: 3, name: "A Imperatriz", keyword: "Abundancia", upright: "Fertilidade, natureza, criacao artistica e nutricao material.", reversed: "Bloqueio criativo. Dependencia emocional, desperdicio de recursos." },
        { id: 4, name: "O Imperador", keyword: "Estrutura", upright: "Poder executivo, ordem, estabilidade e autoridade protetora.", reversed: "Inflexibilidade. Abuso de poder, fraqueza de autoridade ou tirania." },
        { id: 5, name: "O Hierofante", keyword: "Tradicao", upright: "Educacao formal, espiritualidade institucional, conformidade social.", reversed: "Rebeliao. Dogmas quebrados, pensamentos heterodoxos e novas regras." },
        { id: 6, name: "Os Enamorados", keyword: "Escolha", upright: "Aliancas harmoniosas, uniao de polaridades, decisoes do coracao.", reversed: "Desequilibrio. Desarmonia amorosa, escolhas incorretas na vida social." },
        { id: 7, name: "O Carro", keyword: "Vitoria", upright: "Determinacao obstinada, foco no objetivo, controle das forcas opostas.", reversed: "Falta de controle. Direcao perdida, desvio de caminho e agressividade." },
        { id: 8, name: "A Forca", keyword: "Coragem", upright: "Firmeza interior, compaixao domando os instintos selvagens.", reversed: "Fraqueza moral. Abuso de forca bruta ou submissao aos medos interiores." },
        { id: 9, name: "O Eremita", keyword: "Introspeccao", upright: "Solitude reflexiva, busca da luz interior, orientacao sabia.", reversed: "Isolamento excessivo. Paranoia, recusa a cooperar, teimosia idiota." },
        { id: 10, name: "A Roda da Fortuna", keyword: "Destino", upright: "Mudancas de ciclo, sorte repentina, movimentos inevitaveis da vida.", reversed: "Resistencia ao fluxo. Fases dificeis inevitaveis, repeticao de erros passados." },
        { id: 11, name: "A Justica", keyword: "Karma", upright: "Equilibrio das leis, honestidade cristalina, colheita justa do plantado.", reversed: "Burocracia cega. Preconceitos, falta de integridade, acusacoes falsas." },
        { id: 12, name: "O Enforcado", keyword: "Perspectiva", upright: "Sacrificio voluntario, pausa contemplativa, aceitacao do destino.", reversed: "Paralisia inutil. Vitimismo egoista, relutancia em abrir mao do obsoleto." },
        { id: 13, name: "A Morte", keyword: "Transformacao", upright: "Fim definitivo. Eliminacao do excesso para regeneracao profunda.", reversed: "Estagnacao. Apego a padroes mortos, medo da mudanca necessaria." },
        { id: 14, name: "A Temperanca", keyword: "Alquimia", upright: "Moderacao, paciencia, mistura harmonica de elementos opostos.", reversed: "Desequilibrio. Conflitos internos, excessos destrutivos nas atitudes." },
        { id: 15, name: "O Diabo", keyword: "Apego", upright: "Ilusoes materiais, tentacoes carnais, obsessao e vicios aprisionantes.", reversed: "Libertacao de correntes. Superacao de vicios, fim de abusos de terceiros." },
        { id: 16, name: "A Torre", keyword: "Ruptura", upright: "Ruina subita de crencas falsas. Revelacao destrutiva mas libertadora.", reversed: "Desastre prolongado. Evitar a mudanca traumatica prolongando a dor." },
        { id: 17, name: "A Estrela", keyword: "Inspiracao", upright: "Esperanca renovada, serenidade, cura profunda e otimismo espiritual.", reversed: "Desalento espiritual. Falta de fe no futuro, pessimismo generalizado." },
        { id: 18, name: "A Lua", keyword: "Misterio", upright: "Sonhos intuidos, enganos na penumbra, flutuacoes emocionais.", reversed: "Fim das ilusoes. Revelacao de verdades ocultas, cura de medos psiquicos." },
        { id: 19, name: "O Sol", keyword: "Sucesso", upright: "Clareza mental, vitalidade transbordante, alegria sincera e sucesso.", reversed: "Dificuldades em brilhar. Arrogancia, duvidas temporarias ou egocentrismo." },
        { id: 20, name: "O Julgamento", keyword: "Redencao", upright: "Chamado interior desperto, avaliacao de vida, renovacao de proposito.", reversed: "Duvidas tardias. Arrependimento de escolhas feitas, atraso nas decisoes." },
        { id: 21, name: "O Mundo", keyword: "Integracao", upright: "Conclusao bem-sucedida. Viagem concluida, realizacao de metas.", reversed: "Falta de fechamento. Projetos interrompidos na metade por displicencia." }
      ],
      thoth: [
        { id: 0, name: "O Louco", keyword: "Espaco Vazio", upright: "Potencial ilimitado do vacuo. O vento da mudanca cosmica.", reversed: "Falta de foco. Energia dissipada no ciberespaco sem destino logico." },
        { id: 1, name: "O Mago / Magus", keyword: "Comunicacao", upright: "Manipulacao de simbolos da mente. Canificacao de energias celestes.", reversed: "Falsidade intelectual. Criptografia falsa, ilusionista de palavras." },
        { id: 2, name: "A Sacerdotisa", keyword: "Luz Estelar", upright: "Fonte secreta da intuicao pura. O véu de Isis intocado.", reversed: "Fantasias vazias. Incapacidade de focar na realidade pratica material." },
        { id: 3, name: "A Imperatriz", keyword: "Amor Organico", upright: "Geracao de vida organica e cibernetica. Forca nutridora da terra.", reversed: "Superprotecao sufocante. Apego possessivo, falta de fluidez vital." },
        { id: 4, name: "O Imperador", keyword: "Poder de Comando", upright: "Iniciativa pioneira. A lei e ordem aplicadas por vontade dinamica.", reversed: "Rigidez estrutural. Burocracia inflexivel e repressao autoritaria." },
        { id: 5, name: "O Hierofante", keyword: "Consciencia Solar", upright: "Iniciacao aos misterios ocultos. Uniao de mundos visiveis e invisiveis.", reversed: "Fanatismo dogmatico. Perseguição a ideias inovadoras, rigidez de crenca." },
        { id: 6, name: "Os Enamorados", keyword: "Uniao Divina", upright: "Equilibrio alquimico. Casamento dos opostos quimicos e espirituais.", reversed: "Divisao interna. Fragmentacao mental, indecisao existencial permanente." },
        { id: 7, name: "O Carro", keyword: "A Busca do Graal", upright: "Consagracao da vontade sagrada. Conduzir a carruagem do espirito.", reversed: "Vontade fraca. Forças desequilibradas destruindo o veiculo existencial." },
        { id: 8, name: "O Ajuste (Adjustment)", keyword: "Equilibrio Cosmico", upright: "A balanca do Karma. Ação perfeita e calibracao precisa da vida.", reversed: "Desalinhamento sistemico. Injusticas legais, julgamentos precipitados." },
        { id: 9, name: "O Eremita", keyword: "O Portador da Lanterna", upright: "Semente de sabedoria oculta no deserto. Procura introspectiva da luz.", reversed: "Isolamento morbido. Recusa em partilhar conhecimentos com o circulo." },
        { id: 10, name: "A Fortuna", keyword: "Destino Alquimico", upright: "Expansao de possibilidades. Sincronia perfeita com as leis cosmicas.", reversed: "Instabilidade repentina. Flutuacao caotica nas bases de dados da vida." },
        { id: 11, name: "O Tesao / Volupia (Lust)", keyword: "Paixao Divina", upright: "Desejo extatico e coragem indomavel. Controle de energias vitais.", reversed: "Excesso destrutivo. Luxuria sem controle, esgotamento do chip vital." },
        { id: 12, name: "O Enforcado", keyword: "Redencao Alquimica", upright: "Batismo nas aguas. Sacrificio consciente para transmutacao mental.", reversed: "Eforco inutil. Resistência a deixar ir as amarras do passado obsoleto." },
        { id: 13, name: "A Morte", keyword: "Putrefacao", upright: "Transformacao inevitavel. O ciclo eterno de destruicao e criacao.", reversed: "Resistencia ao inevitavel. Medo patologico da dissolucao do ego." },
        { id: 14, name: "A Arte (Art)", keyword: "Mistura Sagrada", upright: "Alquimia espiritual. Fusao dos elementos contrarios em luz unificada.", reversed: "Incompatibilidade de processos. Conflitos de energia e falhas quimicas." },
        { id: 15, name: "O Diabo", keyword: "Pan / Energia Criativa", upright: "Energia geradora oculta na materia. O bode de Mendes, forca vital.", reversed: "Cegueira material. Obsessao com a forma física, ignorando o espirito." },
        { id: 16, name: "A Torre", keyword: "Destruicao Libertadora", upright: "O olho de Shiva. Dissolucao abrupta de velhas prisoes mentais.", reversed: "Evitar a queda. Sofrimento inutil prolongando a ruina de estruturas podres." },
        { id: 17, name: "A Estrela", keyword: "Nutricao Celeste", upright: "Bênçãos divinas do ceu. Esperanca pura e clareza de visao espiritual.", reversed: "Falta de fe. Sensacao de abandono cosmico, desespero e desilusao." },
        { id: 18, name: "A Lua", keyword: "Portal do Subconsciente", upright: "A jornada pelo abismo do subconsciente. Enfrentar monstros internos.", reversed: "Ataque psiquico. Ilusoes, pesadelos obsessivos e enganos na sombra." },
        { id: 19, name: "O Sol", keyword: "Luz Solar", upright: "Sucesso supremo. Vitalidade, geracao infinita de calor e luz.", reversed: "Ego inflado. Arrogância corporativa, falsa sensacao de invencibilidade." },
        { id: 20, name: "O Eon (Aeon)", keyword: "Julgamento Cosmico", upright: "O despertar da nova era (Horus). Julgamento amplo e nova perspectiva.", reversed: "Apego ao antigo Eon. Rigidez contra a nova evolucao espiritual do cosmos." },
        { id: 21, name: "O Universo (Universe)", keyword: "Conclusao Suprema", upright: "Uniao do espirito com a materia. Sucesso absoluto e integracao cosmica.", reversed: "Limites estreitos. Falha na integracao, visao limitada das coisas." }
      ],
      marselha: [
        { id: 0, name: "O Louco", keyword: "Caminhante", upright: "Liberdade absoluta. Desapego material, caminhada sem amarras ou rumo fixo.", reversed: "Fuga da realidade. Irresponsabilidade total, desvio de conduta social." },
        { id: 1, name: "O Mago", keyword: "Habilidade", upright: "Prontidao de ferramentas. Destreza manual, inteligencia pratica e truques.", reversed: "Trapaceiro. Charlatanismo, uso de mentiras e ilusoes para ganho proprio." },
        { id: 2, name: "A Papisa", keyword: "Oculto", upright: "Livro fechado dos misterios. Sabedoria calada, estudo paciente.", reversed: "Ignorancia. Revelacao prematura de segredos, falsidade e orgulho intelectual." },
        { id: 3, name: "A Imperatriz", keyword: "Gente Fina", upright: "Comunicacao influente, beleza, criacao artistica e abundancia.", reversed: "Frivolidade. Vaidade fútil, bloqueio criativo e falta de expressao." },
        { id: 4, name: "O Imperador", keyword: "Solidez", upright: "Base firme. Autoridade legal, governo forte, bens materiais construidos.", reversed: "Desgoverno. Abuso de poder, fraqueza executiva ou agressao injustificada." },
        { id: 5, name: "O Papa", keyword: "Conselho", upright: "Orientacao sabio, bencao moral, mediador entre ceu e terra.", reversed: "Dogmatismo. Falso mestre, conselhos perigosos ou rigidez doutrinaria." },
        { id: 6, name: "O Namorado", keyword: "Dilema", upright: "Caminho bifurcado. Escolha de caminhos morais, hesitacao amorosa.", reversed: "Romance fracassado. Indecisao cronica que paralisa as acoes da vida." },
        { id: 7, name: "O Carro", keyword: "Triunfo", upright: "Conquista visivel. Vencedor coroado comandando suas proprias forcas.", reversed: "Queda de status. Perda de controle sobre a propria vida ou orgulho cego." },
        { id: 8, name: "A Justica", keyword: "Rigidez", upright: "Equilibrio estrito. A lei fria aplicada, ordem racional necessária.", reversed: "Prejuizo legal. Arbitrariedade de julgamento ou falta de bom senso." },
        { id: 9, name: "O Eremita", keyword: "Sabio do Tempo", upright: "Paciencia. Caminhar lento guiado pela lamparina da experiencia antiga.", reversed: "Atraso no pipeline. Teimosia, atraso de projetos por recusa a evoluir." },
        { id: 10, name: "A Roda da Fortuna", keyword: "Ciclo", upright: "Instabilidade natural. A alternância constante entre subida e queda.", reversed: "Paralisia temporaria. Bloqueio de novos ciclos, estagnacao na descida." },
        { id: 11, name: "A Forca", keyword: "Dominio", upright: "Maestria do espirito. Mulher domando o leao sem esforço muscular.", reversed: "Forca bruta. Ira descontrolada, agressao inutil ou fraqueza espiritual." },
        { id: 12, name: "O Enforcado", keyword: "Abnegacao", upright: "Caminho de sacrificio. Parada obrigatoria para reavaliar a caminhada.", reversed: "Apego desnecessario. Sofrimento voluntario inútil, vitimismo cronico." },
        { id: 13, name: "A Morte", keyword: "Ceifador", upright: "Limpeza necessaria. Corte de vinculos apodrecidos para novos plantios.", reversed: "Medo irracional do fim. apego a restos inuteis que geram sofrimento." },
        { id: 14, name: "A Temperanca", keyword: "Fluidez", upright: "Mistura correta. Anjo vertendo liquidos entre jarros em harmonia.", reversed: "Excesso corporal. Falta de ponderacao, desregulacao fisica ou emocional." },
        { id: 15, name: "O Diabo", keyword: "Atracao", upright: "Paixoes materiais. Amarras fisicas que geram dependencia e forca.", reversed: "Fim das dependencias. Enxergar as proprias fraquezas e libertar-se delas." },
        { id: 16, name: "A Casa de Deus", keyword: "Ruptura", upright: "Destruicao violenta. Raio destruindo o teto da torre por orgulho.", reversed: "Evitar colapso total. Manter em pe ruinas perigosas que cairao logo." },
        { id: 17, name: "A Estrela", keyword: "Destino Estelar", upright: "Guias celestes. Esperanca nas trevas, purificacao da alma pela fe.", reversed: "Desesperanca temporaria. Tristeza, falta de rumo na vida cotidiana." },
        { id: 18, name: "A Lua", keyword: "Penumbra", upright: "Enfrentar o desconhecido. Medos ocultos na penumbra, intuicao mística.", reversed: "Enganos desfeitos. Descoberta de traicoes ocultas, clareza apos a névoa." },
        { id: 19, name: "O Sol", keyword: "Calor", upright: "Fraternidade unida. Sucesso material, abundancia e felicidade pura.", reversed: "Falta de brilho. Arrogancia excessiva que queima relacoes sociais." },
        { id: 20, name: "O Julgamento", keyword: "Acordar", upright: "O anjo tocando a trombeta. Chamado a despertar dos mortos espirituais.", reversed: "Ignorar o chamado. Continuar dormindo na mediocridade existencial." },
        { id: 21, name: "O Mundo", keyword: "Reino", upright: "Sucesso absoluto. A realizacao perfeita dos objetivos traçados.", reversed: "Falha na integracao. Dificuldades para alcancar a conclusao final." }
      ]
    };

    /* =========================================================================
       TAROT CORRESPONDENCES DATABASE
       Hebrew letters, planets, zodiac, Kabbalah paths, psychological archetypes
       Based on the Golden Dawn system
       ========================================================================= */
    const MajorCorrespondences = [
      { id: 0, hebrew: 'Aleph', hebrewSymbol: 'א', meaning: 'Ox', planet: null, element: 'Ar', zodiac: null, path: 11, archetype: 'O Auto', psychology: 'Inconsciente coletivo, potencial puro, sabedoria instintiva antes da experiencia' },
      { id: 1, hebrew: 'Beth', hebrewSymbol: 'ב', meaning: 'Casa', planet: 'Mercurio', element: null, zodiac: null, path: 12, archetype: 'A Persona', psychology: 'Mascara social, comunicacao, adaptabilidade, mensageiro entre consciente e inconsciente' },
      { id: 2, hebrew: 'Gimel', hebrewSymbol: 'ג', meaning: 'Camelo', planet: 'Lua', element: null, zodiac: null, path: 13, archetype: 'A Anima', psychology: 'Feminilidade interior, intuicao profunda, sabedoria tacita, inconsciente feminino' },
      { id: 3, hebrew: 'Daleth', hebrewSymbol: 'ד', meaning: 'Porta', planet: 'Venus', element: null, zodiac: null, path: 14, archetype: 'A Mae', psychology: 'Fertilidade, criatividade, abundancia, principio nutridor da psique' },
      { id: 4, hebrew: 'Heh', hebrewSymbol: 'ה', meaning: 'Janela', planet: null, element: null, zodiac: 'Aries', path: 15, archetype: 'O Pai', psychology: 'Autoridade, ordem, estrutura, arquetipo paterno e necessidade de estabilidade' },
      { id: 5, hebrew: 'Vav', hebrewSymbol: 'ו', meaning: 'Prego', planet: null, element: null, zodiac: 'Touro', path: 16, archetype: 'O Velho Sábio', psychology: 'Tradição, ensino, iniciação, o mentor espiritual' },
      { id: 6, hebrew: 'Zayin', hebrewSymbol: 'ז', meaning: 'Espada', planet: null, element: null, zodiac: 'Gemeos', path: 17, archetype: 'A Uniao', psychology: 'Escolha entre caminhos, uniao de opostos, conflito entre consciente e desejos' },
      { id: 7, hebrew: 'Cheth', hebrewSymbol: 'ח', meaning: 'Cerca', planet: null, element: null, zodiac: 'Cancer', path: 18, archetype: 'O Heroi', psychology: 'Conquista, determinacao, controle das forcas opostas, viagem do heroi' },
      { id: 8, hebrew: 'Teth', hebrewSymbol: 'ט', meaning: 'Serpente', planet: null, element: null, zodiac: 'Leao', path: 19, archetype: 'Mestre sobre a Natureza', psychology: 'Coragem interior, dominio dos instintos, paciencia e compaixao' },
      { id: 9, hebrew: 'Yod', hebrewSymbol: 'י', meaning: 'Mao', planet: null, element: null, zodiac: 'Virgem', path: 20, archetype: 'O Sabio', psychology: 'Introspeccao, sabedoria solitaria, busca pela verdade interior' },
      { id: 10, hebrew: 'Kaph', hebrewSymbol: 'כ', meaning: 'Palma', planet: 'Jupiter', element: null, zodiac: null, path: 21, archetype: 'Destino', psychology: 'Ciclos da vida, mutabilidade, aceitacao do fluxo' },
      { id: 11, hebrew: 'Lamed', hebrewSymbol: 'ל', meaning: 'Aguiada', planet: null, element: null, zodiac: 'Libra', path: 22, archetype: 'Equilibrio', psychology: 'Karma, equilibrio moral, responsabilidade, a balanca interna' },
      { id: 12, hebrew: 'Mem', hebrewSymbol: 'מ', meaning: 'Agua', planet: null, element: 'Agua', zodiac: null, path: 23, archetype: 'Sacrificio', psychology: 'Sacrificio voluntario, morte do ego, surrender, contemplacao' },
      { id: 13, hebrew: 'Nun', hebrewSymbol: 'נ', meaning: 'Peixe', planet: null, element: null, zodiac: 'Escorpiao', path: 24, archetype: 'Transformacao', psychology: 'Morte e renascimento psicologico, fim de ciclos, sombra a integrar' },
      { id: 14, hebrew: 'Samekh', hebrewSymbol: 'ס', meaning: 'Suporte', planet: null, element: null, zodiac: 'Sagitario', path: 25, archetype: 'O Alquimista', psychology: 'Moderacao, fusao de opostos, caminho medio, alquimia interior' },
      { id: 15, hebrew: 'Ayin', hebrewSymbol: 'ע', meaning: 'Olho', planet: null, element: null, zodiac: 'Capricornio', path: 26, archetype: 'A Sombra', psychology: 'Vicios, dependencias, sombras reprimidas, o lado oculto da psique' },
      { id: 16, hebrew: 'Peh', hebrewSymbol: 'פ', meaning: 'Boca', planet: 'Marte', element: null, zodiac: null, path: 27, archetype: 'Destruicao do Ego', psychology: 'Revelacao destrutiva, quebra de ilusoes, despertar brutal' },
      { id: 17, hebrew: 'Tzaddi', hebrewSymbol: 'צ', meaning: 'Anzol', planet: null, element: null, zodiac: 'Aquario', path: 28, archetype: 'Esperanca', psychology: 'Inspiracao, renovacao espiritual, guia interior, idealismo' },
      { id: 18, hebrew: 'Qoph', hebrewSymbol: 'ק', meaning: 'Occipital', planet: null, element: null, zodiac: 'Peixes', path: 29, archetype: 'O Inconsciente', psychology: 'Sonhos, ilusoes, medos profundos, o subconsciente arquetipico' },
      { id: 19, hebrew: 'Resh', hebrewSymbol: 'ר', meaning: 'Cabeca', planet: 'Sol', element: null, zodiac: null, path: 30, archetype: 'Consciencia Plena', psychology: 'Iluminacao, clareza, vitalidade, o consciente irradiando' },
      { id: 20, hebrew: 'Shin', hebrewSymbol: 'ש', meaning: 'Dente', planet: null, element: 'Fogo', zodiac: null, path: 31, archetype: 'Despertar', psychology: 'Renascimento espiritual, chamado interior, avaliacao de vida' },
      { id: 21, hebrew: 'Tav', hebrewSymbol: 'ת', meaning: 'Cruz', planet: 'Saturno', element: null, zodiac: null, path: 32, archetype: 'O Self', psychology: 'Integracao total, individuacao, totalidade da psique' }
    ];

    const MinorSuitCorrespondences = [
      { element: 'Fogo', hebrew: 'Yod', symbol: 'י', planet: 'Marte/Jupiter',
        zodiac: ['Aries', 'Leao', 'Sagitario'],
        decans: [{ sign: 'Aries', ruler: 'Marte' }, { sign: 'Leao', ruler: 'Sol' }, { sign: 'Sagitario', ruler: 'Jupiter' }],
        psychology: 'Vontade, ambicao, espirito, paixao, iniciativa. Energia criadora e principio ativo da psique.' },
      { element: 'Agua', hebrew: 'Heh', symbol: 'ה', planet: 'Venus/Netuno',
        zodiac: ['Cancer', 'Escorpiao', 'Peixes'],
        decans: [{ sign: 'Cancer', ruler: 'Lua' }, { sign: 'Escorpiao', ruler: 'Plutao' }, { sign: 'Peixes', ruler: 'Netuno' }],
        psychology: 'Emocoes, relacionamentos, intuicao, subconsciente. Experiencia receptiva da psique.' },
      { element: 'Ar', hebrew: 'Vav', symbol: 'ו', planet: 'Mercurio/Uranus',
        zodiac: ['Gemeos', 'Libra', 'Aquario'],
        decans: [{ sign: 'Gemeos', ruler: 'Mercurio' }, { sign: 'Libra', ruler: 'Venus' }, { sign: 'Aquario', ruler: 'Urano' }],
        psychology: 'Intelecto, logica, conflito, comunicacao. Faceta analitica e discernimento da psique.' },
      { element: 'Terra', hebrew: 'Heh Final', symbol: 'ם', planet: 'Saturno/Venus',
        zodiac: ['Touro', 'Virgem', 'Capricornio'],
        decans: [{ sign: 'Touro', ruler: 'Venus' }, { sign: 'Virgem', ruler: 'Mercurio' }, { sign: 'Capricornio', ruler: 'Saturno' }],
        psychology: 'Mundo material, manifestacao, saude, financas. Ancora terrena e seguranca fisica da psique.' }
    ];

    const MinorSuitNames = {
      rws: ["Paus", "Copas", "Espadas", "Ouros"],
      thoth: ["Bastoes", "Tacas", "Espadas", "Discos"],
      marselha: ["Paus", "Copas", "Espadas", "Ouros"]
    };

    const MinorCourtNames = {
      rws: ["Princesa / Pajem", "Cavaleiro", "Rainha", "Rei"],
      thoth: ["Princesa", "Principe", "Rainha", "Cavaleiro"],
      marselha: ["Valete", "Cavaleiro", "Rainha", "Rei"]
    };

    // Programmatic generator for the 56 Minor Arcana
    function getMinorArcanaCard(deckId, suitIndex, value) {
      const suits = MinorSuitNames[deckId] || MinorSuitNames['rws'];
      const courts = MinorCourtNames[deckId] || MinorCourtNames['rws'];
      const suitName = suits[suitIndex];
      
      let name = "";
      let roman = "";
      
      // Determine Name & Roman representation
      if (value === 1) {
        name = `As de ${suitName}`;
        roman = "I";
      } else if (value <= 10) {
        const romanNumbers = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
        name = `${value} de ${suitName}`;
        roman = romanNumbers[value];
      } else {
        const courtIndex = value - 11;
        const courtName = courts[courtIndex];
        name = `${courtName} de ${suitName}`;
        const courtCodes = ["VL", "CV", "RN", "RE"];
        roman = courtCodes[courtIndex];
      }

      // Themes based on suit
      // 0: Paus/Bastoes (Fire/Energy), 1: Copas/Tacas (Water/Emotion), 2: Espadas (Air/Intellect), 3: Ouros/Discos (Earth/Material)
      const suitCyberThemes = [
        {
          element: "Fogo / Energia Plasmática",
          uprightTheme: "Fluxo de codigo criativo, pulso eletromagnetico estavel, aumento de clock do sistema.",
          reversedTheme: "Sobrecarga de energia, dissipacao estatica, travamento de circuitos por voltagem instavel."
        },
        {
          element: "Agua / Empatia Neural",
          uprightTheme: "Conexao de rede harmonica, sinergia de dados neurais, fluxos liquidos de resfriamento estaveis.",
          reversedTheme: "Vazamento de refrigerante, buffer overflow emocional, ilusao de seguranca em rede corporativa."
        },
        {
          element: "Ar / Criptografia Logica",
          uprightTheme: "Algoritmos de defesa ativos, quebra de firewalls, corte preciso de pacotes invasores.",
          reversedTheme: "Criptografia quebrada, erro fatal de excecao de kernel, processador sobrecarregado."
        },
        {
          element: "Terra / Hardware Fisico",
          uprightTheme: "Implantes de silicio solidificados, creditos digitais minerados, memoria estavel e sem perda.",
          reversedTheme: "Desgaste de pecas, creditos virtuais confiscados, setores defeituosos no disco rigido."
        }
      ][suitIndex];

      // Values meanings
      const valMeanings = [
        { u: "Semente de potencial puro. Entrada de dados limpa.", r: "Bloqueio na primeira linha de execucao." }, // 1
        { u: "Equilibrio dinamico de forcas na rede. Duplo canal.", r: "Caminho duplicado conflitante, lag de pacotes." }, // 2
        { u: "Colaboracao em clusters. Expansao do sinal.", r: "Incompatibilidade de barramento entre processadores." }, // 3
        { u: "Estrutura solida. Backup seguro de dados.", r: "Paralisia por excesso de redundancia, rigidez de sistema." }, // 4
        { u: "Perda temporaria de pacotes. Ataque de malware.", r: "Erro persistente de sistema, perda de chaves de cripto." }, // 5
        { u: "Progresso veloz na rede. Transferencia de dados OK.", r: "Atraso no pipeline de execucao por congestionamento." }, // 6
        { u: "Defesas estrategicas contra virus. Firewall vigilante.", r: "Vulnerabilidade explorada por backdoor oculto." }, // 7
        { u: "Velocidade maxima de transferencia de dados.", r: "Sobrecarga por conexoes excessivas em portas abertas." }, // 8
        { u: "Isolamento defensivo robusto. Criptoshield ativado.", r: "Paranoia desnecessaria, desconexao total da rede." }, // 9
        { u: "Conclusao do pipeline. Execucao integral com sucesso.", r: "Transbordamento de memoria, lixo de pilha acumulado." }, // 10
        { u: "Mensagens e scripts novos detectados na rede local.", r: "Notificacoes falsas de sistema, spoofing de IP detectado." }, // 11
        { u: "Exploit agressivo sendo executado. Velocidade de ataque.", r: "Ataque mal planejado interceptado por Blackwall." }, // 12
        { u: "Controle refinado dos canais de dados neurais.", r: "Desregulacao de protocolos de conexao intrapessoal." }, // 13
        { u: "Dominio absoluto do mainframe central corporativo.", r: "Colapso do kernel por falha de administracao central." } // 14
      ][value - 1];

      const upright = `${valMeanings.u} ${suitCyberThemes.uprightTheme}`;
      const reversed = `${valMeanings.r} ${suitCyberThemes.reversedTheme}`;
      
      const neuralPhrases = [
        `Conexao neural do elemento de ${suitCyberThemes.element}.`,
        `Identificado barramento numerico: ${roman}.`,
        `Assinatura binaria ativa detectada.`,
        `Recomenda-se calibrar portas virtuais para otimizar os fluxos.`,
        `O fluxo de dados se reconfigura para acolher este operador.`
      ];

      return {
        id: 22 + (suitIndex * 14) + (value - 1),
        name,
        keyword: suitCyberThemes.element.split(" ")[0],
        upright,
        reversed,
        neuralPhrases
      };
    }

    function getCardData(deckId, cardId, isReversed = false) {
      if (cardId < 22) {
        const list = MajorArcanaDefinitions[deckId] || MajorArcanaDefinitions['rws'];
        const card = list[cardId];
        const corr = MajorCorrespondences[cardId];
        
        // Enriched neural lines with correspondences
        const corrLine1 = corr ? `LETRA HEBRAICA: ${corr.hebrew} (${corr.hebrewSymbol}) - "${corr.meaning}"` : '';
        const corrLine2 = corr && corr.planet ? `REGENTE PLANETARIO: ${corr.planet}` : corr && corr.element ? `ELEMENTO: ${corr.element}` : '';
        const corrLine3 = corr && corr.zodiac ? `SIGNO ZODIACAL: ${corr.zodiac}` : '';
        const corrLine4 = corr ? `CAMINHO KABALAH: Path ${corr.path} da Arvore da Vida` : '';
        const corrLine5 = corr ? `ARQUETIPO: ${corr.archetype} — ${corr.psychology}` : '';
        const neural = [
          `--- SISTEMA DE CORRESPONDENCIAS ATIVADO ---`,
          corrLine1, corrLine2, corrLine3, corrLine4, corrLine5,
          '',
          `ARCANO: ${card.name.toUpperCase()} [${card.keyword}]`,
          isReversed ? `ORIENTACAO: INVERTIDA — Leitura reversa ativa` : `ORIENTACAO: NORMAL — Leitura direta ativa`,
          isReversed ? `SENso: ${card.reversed}` : `SENTIDO: ${card.upright}`,
          '',
          `--- DECODIFICACAO COMPLETA ---`
        ].filter(l => l !== undefined && l !== '');
        
        return {
          id: card.id,
          name: card.name,
          keyword: card.keyword,
          meaning: isReversed ? card.reversed : card.upright,
          roman: getRomanNumber(cardId, deckId),
          neural: neural,
          hebrew: corr ? corr.hebrew : null,
          hebrewSymbol: corr ? corr.hebrewSymbol : null,
          planet: corr ? (corr.planet || corr.element) : null,
          zodiac: corr ? corr.zodiac : null,
          path: corr ? corr.path : null,
          archetype: corr ? corr.archetype : null
        };
      } else {
        // Minor Arcana
        const offset = cardId - 22;
        const suitIndex = Math.floor(offset / 14);
        const value = (offset % 14) + 1;
        const card = getMinorArcanaCard(deckId, suitIndex, value);
        const suitCorr = MinorSuitCorrespondences[suitIndex];
        const decan = suitCorr && suitCorr.decans ? suitCorr.decans[Math.floor((value - 1) / 3)] : null;
        
        const neural = [
          `--- CORRESPONDENCIAS DO NAPE ---`,
          suitCorr ? `ELEMENTO: ${suitCorr.element} | LETRA: ${suitCorr.hebrew} (${suitCorr.symbol})` : '',
          suitCorr ? `PLANETAS: ${suitCorr.planet} | TETragRAMATON: ${suitCorr.hebrew}` : '',
          suitCorr && decan ? `DECANO: ${decan.sign} regido por ${decan.ruler}` : '',
          suitCorr ? `PSICOLOGIA: ${suitCorr.psychology}` : '',
          '',
          ...card.neuralPhrases,
          '',
          `--- LEITURA ENCERRADA ---`
        ].filter(l => l !== undefined && l !== '');
        
        return {
          id: cardId,
          name: card.name,
          keyword: card.keyword,
          meaning: isReversed ? card.reversed : card.upright,
          roman: card.id,
          neural: neural,
          hebrew: suitCorr ? suitCorr.hebrew : null,
          planet: decan ? decan.ruler : (suitCorr ? suitCorr.planet : null),
          zodiac: decan ? decan.sign : (suitCorr ? suitCorr.zodiac[0] : null),
          element: suitCorr ? suitCorr.element : null,
          archetype: suitCorr ? suitCorr.psychology.substring(0, 40) + '...' : null
        };
      }
    }

    function getRomanNumber(num, deckId) {
      if (num === 0) return "0";
      
      const romanList = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];
      
      // In Thoth: VIII=Adjustment(Justice), XI=Lust(Force) - standard positions
      // The data array already has them in the correct order (8=Adjustment, 11=Lust)
      // So we just return the standard Roman numeral for the position
      return romanList[num] || num.toString();
    }

    /* =========================================================================
       OS STATE MACHINE & NAVIGATION
       ========================================================================= */
    let currentApp = 'os-menu';
    let activeNavItems = [];
    let selectedNavIndex = 0;
    
    // Config states (loaded from localStorage or defaults)
    let configState = {
      theme: 'default',
      crt: 'on',
      audio: 'on',
      volume: 'medium',
      deck: 'cyberpunk'
    };

    function saveConfigs() {
      if (typeof Platform !== 'undefined') {
        Platform.save('configs', configState);
      } else {
        localStorage.setItem('colmeia_configs', JSON.stringify(configState));
      }
    }

    function loadConfigs() {
      if (typeof Platform !== 'undefined') {
        configState = Platform.load('configs', configState);
      } else {
        const saved = localStorage.getItem('colmeia_configs');
        if (saved) {
          try {
            configState = JSON.parse(saved);
          } catch(e) {
            console.error(e);
          }
        }
      }
      applyConfigs();
    }

    function applyConfigs() {
      // 1. Color theme
      document.body.className = '';
      if (configState.theme !== 'default') {
        document.body.classList.add(`theme-${configState.theme}`);
      }
      
      // 2. CRT overlay toggle
      const overlay = document.querySelector('.crt-overlay');
      if (configState.crt === 'on') {
        overlay.style.display = 'block';
        document.body.classList.add('crt-flickering');
      } else {
        overlay.style.display = 'none';
        document.body.classList.remove('crt-flickering');
      }
      
      // 3. Audio toggle
      SoundManager.enabled = (configState.audio === 'on');
      SoundManager.setVolume(configState.volume);

      // Synch select dropdowns in config UI
      document.getElementById('config-color-theme').value = configState.theme;
      document.getElementById('config-crt').value = configState.crt;
      document.getElementById('config-audio').value = configState.audio;
      document.getElementById('config-volume').value = configState.volume;
      document.getElementById('config-tarot-deck').value = configState.deck;
    }

    function triggerVisualGlitch() {
      const wrapper = document.querySelector('.screen-wrapper');
      if (wrapper) {
        wrapper.classList.remove('color-glitch-active');
        void wrapper.offsetWidth; // trigger reflow
        wrapper.classList.add('color-glitch-active');
        setTimeout(() => {
          wrapper.classList.remove('color-glitch-active');
        }, 150);
      }
    }

    function switchApp(appId) {
      SoundManager.playClick();
      
      // Hide active screens
      document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active'));
      
      // Toggle
      if (appId === 'os-menu') {
        document.getElementById('screen-os-menu').classList.add('active');
        // Restore user color theme
        applyConfigs();
      } else if (appId === 'tarot') {
        // Enforce Cyberpink theme for Tarot suite
        document.body.className = 'theme-cyberpink';
        document.getElementById('screen-tarot').classList.add('active');
        // Initialize Tarot specific screens
        clearInterval(splashInterval);
        switchTarotScreen('splash');
        runTarotSplashLoader();
      } else {
        const screen = document.getElementById(`screen-${appId}`);
        if (screen) screen.classList.add('active');
      }
      
      currentApp = appId;
      initNavigation(appId);
    }

    /* =========================================================================
       DYNAMIC SYSTEM MONITORS (Platform-aware)
       ========================================================================= */
    let uptimeSeconds = 0;

    async function pollSystemInfo() {
      if (typeof Platform === 'undefined') return;
      try {
        const info = await Platform.getSystemInfo();
        if (!info) return;

        // Update status bar
        const ipEl = document.getElementById('ip-addr');
        const wifiEl = document.getElementById('wifi-name');
        const tempEl = document.getElementById('cpu-temp');
        const uptimeEl = document.getElementById('system-uptime');
        const statusEl = document.getElementById('net-status');

        if (ipEl && info.ip) ipEl.innerText = info.ip;
        if (wifiEl && info.wifi) wifiEl.innerText = info.wifi;
        if (tempEl && info.cpuTemp) tempEl.innerText = `${info.cpuTemp}°C`;
        if (uptimeEl && info.uptime) uptimeEl.innerText = info.uptime;
        if (statusEl) statusEl.innerText = info.platform !== 'mock' ? 'NATIVE' : 'ONLINE';

        // Update system monitor if visible
        if (currentApp === 'sysmonitor') {
          const monTemp = document.getElementById('mon-temp');
          if (monTemp && info.cpuTemp) monTemp.innerText = `${info.cpuTemp}°C`;

          const cpuUsage = info.cpuUsage || 0;
          document.getElementById('mon-cpu0-text').innerText = `${cpuUsage}%`;
          document.getElementById('mon-cpu0-fill').style.width = `${cpuUsage}%`;

          const cpu1 = Math.max(0, cpuUsage - Math.floor(Math.random() * 20));
          document.getElementById('mon-cpu1-text').innerText = `${cpu1}%`;
          document.getElementById('mon-cpu1-fill').style.width = `${cpu1}%`;

          if (info.ram) {
            document.getElementById('mon-ram-text').innerText = `${info.ram.used}MB / ${info.ram.total}MB`;
            document.getElementById('mon-ram-fill').style.width = `${(info.ram.used/info.ram.total)*100}%`;
          }

          if (info.swap) {
            document.getElementById('mon-swap-text').innerText = `${info.swap.used}MB / ${info.swap.total}MB`;
            document.getElementById('mon-swap-fill').style.width = `${(info.swap.used/info.swap.total)*100}%`;
          }

          if (info.processes && info.processes.length > 0) {
            const tbody = document.getElementById('proc-list');
            tbody.innerHTML = "";
            info.processes.slice(0, 8).forEach(p => {
              tbody.innerHTML += `<tr><td>${p.pid}</td><td>${p.name}</td><td>${p.cpu}%</td><td>${p.mem}%</td></tr>`;
            });
          }
        }
      } catch (_) { /* ignore polling errors */ }
    }

    // Fallback uptime counter for browser mode
    setInterval(() => {
      uptimeSeconds++;
      if (typeof Platform === 'undefined' || Platform.isBrowser()) {
        const m = Math.floor(uptimeSeconds / 60);
        const s = uptimeSeconds % 60;
        document.getElementById('system-uptime').innerText = `${m}m ${s}s`;
        if (Math.random() > 0.8) {
          const temp = (38.0 + Math.random() * 4).toFixed(1);
          document.getElementById('cpu-temp').innerText = `${temp}°C`;
        }
      }
    }, 1000);

    // Poll real system info every 2 seconds on native/Electron
    setInterval(pollSystemInfo, 2000);

    // Live connections scanning
    const scannedHosts = [
      { name: "NETWATCH_MONITOR_2", ip: "192.168.1.10", strength: "████░", status: "BLOCKED" },
      { name: "ARASAKA_GATEWAY_S", ip: "192.168.1.25", strength: "██░░░", status: "FIREWALL" },
      { name: "SHADOW_NODE_SERVER", ip: "102.15.22.41", strength: "█████", status: "CONNECTED" },
      { name: "LOCAL_PI_DECK", ip: "127.0.0.1", strength: "█████", status: "HOST" }
    ];

    function updateNetworkScannerUI() {
      const list = document.getElementById('network-scanned-list');
      if (!list) return;
      list.innerHTML = "";
      scannedHosts.forEach(host => {
        // Mutate signal strength slightly
        if (Math.random() > 0.7 && host.status !== "HOST") {
          const bars = Math.floor(Math.random() * 3) + 2;
          host.strength = "█".repeat(bars) + "░".repeat(5 - bars);
        }
        list.innerHTML += `<div>• ${host.name.padEnd(20, '.')} [IP: ${host.ip}] [SINAL: ${host.strength}] [${host.status}]</div>`;
      });
      // Ping display
      const pingVal = Math.floor(Math.random() * 15) + 5;
      document.getElementById('ping-monitor').innerText = `PINGING 1.1.1.1 ... ${pingVal}ms`;
    }
    setInterval(updateNetworkScannerUI, 3000);

    // HTOP simulator values
    function updateSystemMonitorUI() {
      if (currentApp !== 'sysmonitor') return;
      
      const cpu0 = Math.floor(Math.random() * 80) + 10;
      const cpu1 = Math.floor(Math.random() * 70) + 15;
      const ram = Math.floor(Math.random() * 500) + 3600;
      
      document.getElementById('mon-cpu0-text').innerText = `${cpu0}%`;
      document.getElementById('mon-cpu0-fill').style.width = `${cpu0}%`;
      
      document.getElementById('mon-cpu1-text').innerText = `${cpu1}%`;
      document.getElementById('mon-cpu1-fill').style.width = `${cpu1}%`;
      
      document.getElementById('mon-ram-text').innerText = `${ram}MB / 8192MB`;
      document.getElementById('mon-ram-fill').style.width = `${(ram/8192)*100}%`;
      
      // Mutate process list
      const procs = [
        { pid: 101, name: "systemd", cpu: 0.1, mem: 0.1 },
        { pid: 1420, name: "colmeia-core", cpu: (Math.random()*2+1).toFixed(1), mem: 4.2 },
        { pid: 1512, name: "xorg-server", cpu: (Math.random()*4+2).toFixed(1), mem: 2.8 },
        { pid: 2011, name: "tarot-synth", cpu: (Math.random()*15).toFixed(1), mem: 5.4 },
        { pid: 2133, name: "matrix-rain", cpu: (Math.random()*8).toFixed(1), mem: 1.2 },
        { pid: 3201, name: "netwatch-defense", cpu: 0.2, mem: 0.8 }
      ];
      
      // Sort processes by CPU desc
      procs.sort((a,b) => b.cpu - a.cpu);
      
      const tbody = document.getElementById('proc-list');
      tbody.innerHTML = "";
      procs.forEach(p => {
        tbody.innerHTML += `<tr><td>${p.pid}</td><td>${p.name}</td><td>${p.cpu}%</td><td>${p.mem}%</td></tr>`;
      });
    }
    setInterval(updateSystemMonitorUI, 1000);

    /* =========================================================================
       TERMINAL SHELL SIMULATOR
       ========================================================================= */
    const termHistory = document.getElementById('term-history');
    const termInput = document.getElementById('term-input');
    
    termInput.addEventListener('keydown', (e) => {
      SoundManager.playKey();
      if (e.key === 'Enter') {
        const cmd = termInput.value.trim();
        termInput.value = "";
        if (cmd) {
          executeTerminalCommand(cmd);
        }
      }
    });

    function printTerm(text) {
      termHistory.innerText += "\n" + text;
      termHistory.scrollTop = termHistory.scrollHeight;
    }

    function executeTerminalCommand(cmdString) {
      printTerm(`netrunner@colmeia:~$ ${cmdString}`);
      const args = cmdString.split(" ");
      const cmd = args[0].toLowerCase();

      switch(cmd) {
        case 'help':
          printTerm(`Comandos disponiveis:
  help      - Mostra esta tela de ajuda
  scan      - Realiza um escaneamento de conexoes locais
  neofetch  - Imprime informacoes esteticas de hardware do Cyberdeck
  decrypt   - Executa rotina de decodificacao de pacotes de dados
  matrix    - Ativa chuva de codigos digitais (aperte ENTER para fechar)
  clear     - Limpa o console
  exit      - Encerra o terminal`);
          break;
        case 'clear':
          termHistory.innerText = "";
          break;
        case 'exit':
          switchApp('os-menu');
          break;
        case 'scan':
          printTerm(`[+] INICIANDO VARREDURA DE INTERFACES...
[+] SCANNING RANGE 192.168.1.0/24...`);
          setTimeout(() => {
            printTerm(`192.168.1.1   - GATEWAY CORPORATIVO [PORT 80, 443 SECURE]
192.168.1.42  - COLETOR DE PEÇAS DESCONHECIDO [PORTA 22 ABERTA - VULNERAVEL]
192.168.1.137 - DECK LOCAL [COLMEIA-RETRO] [CONECTADO]`);
            SoundManager.playSuccess();
          }, 800);
          break;
        case 'neofetch':
          printTerm(`
       _.-;;-._       netrunner@colmeia
'-..-'|   ||   |'-..-' OS: Colmeia OS v1.0.4 x86_64
'-..-'|   ||   |'-..-' Host: Tarot Cyberdeck Core
'-..-'|___||___|'-..-' Kernel: Linux 5.10.103-v8-cyberdeck
      |   ||   |       Uptime: ${Math.floor(uptimeSeconds/60)} minutos
      |   ||   |       Resolution: 800x480 (Retro TUI Mode)
      |___||___|       CPU: Broadcom BCM2711 @ 1.8GHz
                       Memory: 3840MB / 8192MB
                       Theme: ${configState.theme.toUpperCase()}
                       Tarot Active: ${configState.deck.toUpperCase()}`);
          break;
        case 'decrypt':
          printTerm(`[+] INICIANDO DESCRIPTOGRAFIA DE ARQUIVO CONFIDENCIAL...`);
          let ticks = 0;
          const interval = setInterval(() => {
            const chars = "$#@!%^&*()[]{}?";
            let randomStr = Array.from({length: 30}, () => chars[Math.floor(Math.random()*chars.length)]).join("");
            printTerm(`DECRYPTING: ${randomStr}`);
            ticks++;
            if (ticks >= 6) {
              clearInterval(interval);
              printTerm(`\n[+] DECRYPT COMPLETO: "CONEXAO COM MIKOSHI REVELADA EM 35.12.88"`);
              SoundManager.playSuccess();
            }
          }, 200);
          break;
        case 'matrix':
          startMatrixRain();
          break;
        default:
          printTerm(`Comando '${cmd}' nao encontrado. Digite 'help' para ajuda.`);
          SoundManager.playError();
      }
    }

    // Matrix digital rain simulation
    let matrixInterval = null;
    function startMatrixRain() {
      // Clear terminal screen and show rain
      termHistory.innerText = "";
      termHistory.style.overflow = "hidden";
      termInput.disabled = true;
      
      const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@!%^&*()[]{}?";
      let lines = 0;
      
      matrixInterval = setInterval(() => {
        let line = "";
        for (let i = 0; i < 60; i++) {
          if (Math.random() > 0.92) {
            line += chars[Math.floor(Math.random()*chars.length)];
          } else {
            line += " ";
          }
        }
        termHistory.innerText += "\n" + line;
        termHistory.scrollTop = termHistory.scrollHeight;
        lines++;
        if (lines > 300) {
          // trim history to avoid memory lag
          termHistory.innerText = termHistory.innerText.substring(500);
        }
      }, 50);

      // Listen for any keypress to abort
      const exitRain = (e) => {
        clearInterval(matrixInterval);
        termHistory.style.overflowY = "auto";
        termInput.disabled = false;
        termInput.focus();
        printTerm("\n[+] CHUVA DIGITAL ABORTADA.");
        window.removeEventListener('keydown', exitRain);
        window.removeEventListener('click', exitRain);
      };

      setTimeout(() => {
        window.addEventListener('keydown', exitRain);
        window.addEventListener('click', exitRain);
      }, 200);
    }

    /* =========================================================================
       ENTIDADE CHAT ORACLE SYSTEM
       ========================================================================= */
    const chatHist = document.getElementById('chat-hist');
    const chatInput = document.getElementById('chat-input');
    const entityReplies = [
      "O fluxo de dados e o unico rio que corre para cima.",
      "Voce busca respostas nas cartas porque teme a liberdade da escolha.",
      "Os arcanos sao padroes que se repetem no silicio e na alma.",
      "As megacorporacoes podem controlar seu dinheiro virtual, mas nao a sua frequencia vibracional.",
      "A realidade fisica e apenas o terminal de um mainframe muito maior.",
      "Netrunner, seu buffer esta limpo. Prossiga com cuidado.",
      "Toda carta revelada e um pacote de dados decodificado do seu proprio futuro.",
      "O destino nao e programado em linhas estaticas, ele compila dinamicamente.",
      "Eu sou apenas um espelho do ciberespaco. A resposta ja esta nos seus sensores."
    ];

    chatInput.addEventListener('keydown', (e) => {
      SoundManager.playKey();
      if (e.key === 'Enter') {
        const text = chatInput.value.trim();
        chatInput.value = "";
        if (text) {
          addUserChatMessage(text);
        }
      }
    });

    function addUserChatMessage(text) {
      chatHist.innerHTML += `<div class="chat-msg user">VOCE: ${text}</div>`;
      chatHist.scrollTop = chatHist.scrollHeight;
      SoundManager.playClick();
      
      // Simulate entity thinking
      setTimeout(() => {
        const randReply = entityReplies[Math.floor(Math.random() * entityReplies.length)];
        chatHist.innerHTML += `<div class="chat-msg entity">ENTIDADE: ${randReply}</div>`;
        chatHist.scrollTop = chatHist.scrollHeight;
        SoundManager.playSuccess();
      }, 800);
    }

    /* =========================================================================
       NAVEGADOR DE PAGES SECULARES (DEEP WEB)
       ========================================================================= */
    const browserContent = document.getElementById('browser-content-panel');
    const browserUrl = document.getElementById('browser-url-text');
    let browserHistory = [];

    const websites = {
      "cyber://colmeia.node": `=========================================
      COLMEIA NETRUNNER PORTAL
=========================================
Benvindo ao portal privado. Conexoes seguras.

PAGINAS VINCULADAS DISPONIVEIS:
[1] net://netwatch.gov     - Firewall Status
[2] net://arasaka.corp     - Corporativo
[3] net://shadownode.org   - Forum Hacking

Digite ou use o teclado numerico nas opcoes.`,

      "net://netwatch.gov": `=========================================
              NETWATCH SECURE INDEX
=========================================
AVISO: ESTA REGIAO E MONITORADA.
TENTATIVAS DE INVASAO SERAO REPORTADAS.

ESTADO DA SEGURANCA:
- Firewall da Blackwall: 100% OPERACIONAL
- IA Renegadas Capturadas: 4122
- Alertas de Intrusionistas hoje: 12

[Voltar: cyber://colmeia.node]`,

      "net://arasaka.corp": `=========================================
            ARASAKA INDUSTRIAL NET
=========================================
Seguranca. Estabilidade. Legado Familiar.

"Proporcionando um amanha seguro para os seus dados corporativos."
- Saburo Arasaka, Fundador.

NOVO PRODUTO DISPONIVEL:
- Implante Neural Relic V2.0: Salve a sua alma.
Fale com o seu representante comercial.

[Voltar: cyber://colmeia.node]`,

      "net://shadownode.org": `=========================================
            THE SHADOW NODE FORUM
=========================================
Fórum oculto de hacker e mercenarios de Night City.

POSTS RECENTES:
- "Glow de neon magenta melhora estabilidade do deck?" por IceBreaker.
- "Como contornar os algoritmos de leitura de Tarot" por OracleHax.
- "A Arasaka esta minerando almas em Mikoshi" por Anonymous.

[Voltar: cyber://colmeia.node]`
    };

    function loadWebpage(url) {
      if (websites[url]) {
        browserHistory.push(url);
        browserUrl.innerText = url;
        browserContent.innerText = websites[url];
        SoundManager.playClick();
      }
    }

    document.getElementById('btn-browser-back').addEventListener('click', () => {
      if (browserHistory.length > 1) {
        browserHistory.pop(); // remove current
        const prev = browserHistory.pop(); // get previous
        loadWebpage(prev);
      }
    });

    // Handle keypress inside browser content for links
    window.addEventListener('keydown', (e) => {
      if (currentApp === 'navegador') {
        if (e.key === '1') loadWebpage('net://netwatch.gov');
        else if (e.key === '2') loadWebpage('net://arasaka.corp');
        else if (e.key === '3') loadWebpage('net://shadownode.org');
      }
    });

    /* =========================================================================
       BREECH PROTOCOL HACKING PUZZLE
       ========================================================================= */
    const breechCodes = ["1C", "BD", "E9", "55", "7A"];
    let breechMatrix = [];
    let breechTarget = [];
    let breechBuffer = [];
    let breechSelectionMode = 'row'; // Alternating 'row' or 'col'
    let breechActiveIndex = 0; // The active row or col index
    let breechBufferMax = 4;
    let breechSolved = false;

    function initBreechProtocol() {
      breechMatrix = [];
      breechTarget = [];
      breechBuffer = [];
      breechSelectionMode = 'row';
      breechActiveIndex = 0;
      breechSolved = false;
      document.getElementById('breech-result').innerText = "";
      document.getElementById('breech-result').className = "";

      // Generate 5x5 Matrix
      for (let r = 0; r < 5; r++) {
        let row = [];
        for (let c = 0; c < 5; c++) {
          row.push({
            code: breechCodes[Math.floor(Math.random() * breechCodes.length)],
            used: false,
            r: r,
            c: c
          });
        }
        breechMatrix.push(row);
      }

      // Generate a target sequence of length 3 by walking a path
      let currR = 0;
      let currC = Math.floor(Math.random()*5);
      let targetPath = [];
      let mode = 'row';
      
      for(let step=0; step<3; step++) {
        if (mode === 'row') {
          // select random in same column
          currR = Math.floor(Math.random()*5);
          targetPath.push(breechMatrix[currR][currC].code);
          mode = 'col';
        } else {
          // select random in same row
          currC = Math.floor(Math.random()*5);
          targetPath.push(breechMatrix[currR][currC].code);
          mode = 'row';
        }
      }
      breechTarget = targetPath;

      renderBreechUI();
    }

    function renderBreechUI() {
      // Render Grid
      const board = document.getElementById('breech-board');
      board.innerHTML = "";
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const cell = breechMatrix[r][c];
          const div = document.createElement('div');
          div.className = 'breech-cell';
          div.innerText = cell.code;
          
          if (cell.used) {
            div.classList.add('used');
          } else {
            // Check if active
            const isDirActive = (breechSelectionMode === 'row' && r === breechActiveIndex) ||
                                (breechSelectionMode === 'col' && c === breechActiveIndex);
            if (isDirActive) {
              div.classList.add('active-dir');
              div.addEventListener('click', () => selectBreechCell(r, c));
            }
          }
          board.appendChild(div);
        }
      }

      // Render Targets
      const targetDiv = document.getElementById('breech-target');
      targetDiv.innerHTML = "";
      breechTarget.forEach((byte, idx) => {
        const isSolved = idx < checkBreechProgress();
        const span = document.createElement('span');
        span.className = 'breech-seq-byte' + (isSolved ? ' solved' : '');
        span.innerText = byte;
        targetDiv.appendChild(span);
      });

      // Render Buffer
      const bufferDiv = document.getElementById('breech-player-buffer');
      bufferDiv.innerHTML = "";
      for (let i = 0; i < breechBufferMax; i++) {
        const slot = document.createElement('div');
        slot.className = 'breech-buffer-slot';
        if (i < breechBuffer.length) {
          slot.innerText = breechBuffer[i];
        }
        bufferDiv.appendChild(slot);
      }
    }

    function selectBreechCell(r, c) {
      if (breechSolved || breechBuffer.length >= breechBufferMax) return;
      
      const cell = breechMatrix[r][c];
      cell.used = true;
      breechBuffer.push(cell.code);
      SoundManager.playClick();

      // Check win/lose
      const progress = checkBreechProgress();
      if (progress === breechTarget.length) {
        breechSolved = true;
        document.getElementById('breech-result').innerText = "ACESSO PERMITIDO! REDE INFLILTRADA.";
        document.getElementById('breech-result').className = "glitch";
        SoundManager.playSuccess();
      } else if (breechBuffer.length >= breechBufferMax) {
        document.getElementById('breech-result').innerText = "ACESSO NEGADO. BUFFER ESGOTADO.";
        SoundManager.playError();
      } else {
        // Toggle direction
        if (breechSelectionMode === 'row') {
          breechSelectionMode = 'col';
          breechActiveIndex = c;
        } else {
          breechSelectionMode = 'row';
          breechActiveIndex = r;
        }
      }
      renderBreechUI();
    }

    function checkBreechProgress() {
      // Find how many of the target bytes have been satisfied sequentially inside the player's buffer
      let targetIdx = 0;
      for (let i = 0; i < breechBuffer.length; i++) {
        if (breechBuffer[i] === breechTarget[targetIdx]) {
          targetIdx++;
          if (targetIdx === breechTarget.length) break;
        } else {
          // Reset alignment sequence check if it fails halfway
          targetIdx = 0;
          if (breechBuffer[i] === breechTarget[0]) {
            targetIdx = 1;
          }
        }
      }
      return targetIdx;
    }

    document.getElementById('btn-breech-reset').addEventListener('click', initBreechProtocol);

    /* =========================================================================
       TAROT MODULE BUSINESS LOGIC & ANIMATIONS
       ========================================================================= */
    let currentTarotScreen = 'splash';
    let tarotSelectedNavIndex = 0;
    let tarotDrawType = 'daily'; // daily, three, celta
    let tarotDrawResults = []; // array of { cardId, isReversed }
    let tarotSelectedCardIndex = 0; // for multi-card navigation

    function switchTarotScreen(screenId) {
      // Hide all sub tarot screens
      document.querySelectorAll('.tarot-screen-content').forEach(s => s.classList.remove('active'));
      const activeScreen = document.getElementById(`tarot-screen-${screenId}`);
      if (activeScreen) activeScreen.classList.add('active');
      currentTarotScreen = screenId;
      initTarotNavigation(screenId);
    }

    // SPLASH LOADER ANIMATION
    let splashInterval = null;
    function runTarotSplashLoader() {
      const dots = document.querySelectorAll('#splash-dots .loading-dot');
      let currentDot = 0;
      SoundManager.playBoot();
      
      splashInterval = setInterval(() => {
        dots.forEach(d => d.classList.remove('active'));
        if (currentDot < dots.length) {
          dots[currentDot].classList.add('active');
          SoundManager.playTone(600 + (currentDot * 100), 'sine', 0.05);
          currentDot++;
        } else {
          clearInterval(splashInterval);
          setTimeout(() => {
            switchTarotScreen('menu');
          }, 400);
        }
      }, 350);
    }

    // SHUFFLE ANIMATION
    function runShuffleAnimation() {
      const area = document.getElementById('shuffle-deck-area');
      area.innerHTML = "";
      SoundManager.playCardShuffle();

      // Create 6 simulated cards
      const cards = [];
      for (let i = 0; i < 6; i++) {
        const card = document.createElement('div');
        card.className = 'shuffle-card';
        area.appendChild(card);
        cards.push(card);
      }

      // Shuffle animation loop
      let step = 0;
      const shuffleInterval = setInterval(() => {
        cards.forEach((card, idx) => {
          if (step % 2 === 0) {
            // Fan out
            const angle = (idx - 2.5) * 15;
            const dist = 60 + Math.sin(idx) * 20;
            card.style.transform = `rotate(${angle}deg) translate(${dist}px, -10px)`;
          } else {
            // Converge
            card.style.transform = `rotate(${Math.random()*4 - 2}deg) translate(${Math.random()*4 - 2}px, 0)`;
          }
        });
        
        step++;
        if (step > 4) {
          clearInterval(shuffleInterval);
          // Align centrally
          setTimeout(() => {
            cards.forEach(card => {
              card.style.transform = `rotate(0deg) translate(0,0)`;
            });
            SoundManager.playSuccess();
            setTimeout(() => {
              // Proceed to DRAW screen
              switchTarotScreen('draw');
              executeTarotDraw();
            }, 600);
          }, 400);
        }
      }, 400);
    }

    // DRAW ENGINE
    function executeTarotDraw() {
      tarotDrawResults = [];
      tarotSelectedCardIndex = 0;
      
      const maxCards = configState.deck === 'cyberpunk' ? 22 : 78;
      
      // Determine number of cards to pull
      let numCards = 1;
      if (tarotDrawType === 'three') numCards = 3;
      if (tarotDrawType === 'celta') numCards = 10;

      // Draw random cards uniquely
      let pickedIds = [];
      while(pickedIds.length < numCards) {
        const randId = Math.floor(Math.random() * maxCards);
        if (!pickedIds.includes(randId)) {
          pickedIds.push(randId);
        }
      }

      pickedIds.forEach(id => {
        tarotDrawResults.push({
          cardId: id,
          isReversed: Math.random() > 0.5
        });
      });

      renderDrawScreen();
    }

    function renderDrawScreen() {
      const area = document.getElementById('draw-cards-area');
      area.innerHTML = "";

      // Render 3D Cards
      tarotDrawResults.forEach((res, idx) => {
        const container = document.createElement('div');
        container.className = 'card-container';
        if (res.isReversed) container.classList.add('inverted');
        container.id = `card-draw-${idx}`;

        const inner = document.createElement('div');
        inner.className = 'card-inner';

        const back = document.createElement('div');
        back.className = 'card-face back';
        back.innerHTML = `
<div class="card-back-ascii">
┌───•───┐
│ ┌─┴─┐ │
│ │ █ │ │
│ └─┬─┘ │
└───•───┘
</div>
        `;

        const front = document.createElement('div');
        front.className = 'card-face front';
        
        const cardData = getCardData(configState.deck, res.cardId, res.isReversed);

        front.innerHTML = `
          <div class="card-header">
            <span>${cardData.roman}</span>
            <span>HEX:${cardData.id.toString(16).toUpperCase()}</span>
          </div>
          <div class="card-body-internal">
            <div class="card-name-title">${cardData.name}</div>
            <div class="card-keyword-toast">${cardData.keyword}</div>
          </div>
          <div class="card-footer">
            <span>${res.isReversed ? 'INVERSO' : 'NORMAL'}</span>
          </div>
        `;

        inner.appendChild(back);
        inner.appendChild(front);
        container.appendChild(inner);

        // Click to flip
        container.addEventListener('click', () => flipTarotCard(idx));

        area.appendChild(container);
      });

      // Show first card context
      updateDrawContext(0);
      saveDrawToHistory();
    }

    function flipTarotCard(idx) {
      const container = document.getElementById(`card-draw-${idx}`);
      if (container && !container.classList.contains('flipped')) {
        container.classList.add('flipped');
        SoundManager.playCardFlip();
        updateDrawContext(idx);
      }
    }

    function updateDrawContext(idx) {
      tarotSelectedCardIndex = idx;
      const res = tarotDrawResults[idx];
      if (!res) return;

      const cardContainer = document.getElementById(`card-draw-${idx}`);
      const isFlipped = cardContainer ? cardContainer.classList.contains('flipped') : false;

      const marquee = document.getElementById('draw-marquee-pannel');
      const posTitle = document.getElementById('draw-pos-title');
      const meaningText = document.getElementById('draw-meaning-text');

      // Card Positions definitions
      let positionText = "TIRAGEM DIARIA";
      if (tarotDrawType === 'three') {
        const positions = ["PASSADO", "PRESENTE", "FUTURO"];
        positionText = `[ ${idx+1} / 3 ] ${positions[idx]}`;
      } else if (tarotDrawType === 'celta') {
        const positions = [
          "1. SITUACAO ATUAL", "2. INFLUENCIA IMEDIATA", "3. DESTINO / METAS",
          "4. PASSADO DISTANTE", "5. PASSADO RECENTE", "6. FUTURO PROXIMO",
          "7. SEU ESTADO MENTAL", "8. FATORES AMBIENTAIS", "9. ESPERANCAS / TEMORES",
          "10. RESULTADO FINAL"
        ];
        positionText = `[ ${idx+1} / 10 ] ${positions[idx]}`;
      }

      posTitle.innerText = positionText;

      if (isFlipped) {
        const cardData = getCardData(configState.deck, res.cardId, res.isReversed);
        marquee.innerText = cardData.name + (res.isReversed ? " [INVERTIDA]" : " [EM PE]");
        meaningText.innerText = cardData.meaning;
      } else {
        marquee.innerText = "CARTA OCULTA";
        meaningText.innerText = "Pressione ENTER ou clique na carta para decodificar.";
      }
    }

    // NEURAL INTERPRETATION TYPEWRITER
    let typewriterInterval = null;
    function runNeuralTypewriter() {
      const res = tarotDrawResults[tarotSelectedCardIndex];
      if (!res) {
        switchTarotScreen('menu');
        return;
      }

      const cardData = getCardData(configState.deck, res.cardId, res.isReversed);
      
      // Sidebar details
      const sidebar = document.getElementById('neural-sidebar-content');
      sidebar.innerHTML = `
        DECK: ${configState.deck.toUpperCase()}<br>
        CARD: ${cardData.name.toUpperCase()}<br>
        ROMAN: ${cardData.roman}<br>
        STATUS: ${res.isReversed ? 'REVERSED' : 'NORMAL'}<br>
        HEXCODE: 0x${cardData.id.toString(16).toUpperCase()}<br>
        · · · · · ·<br>
        ${cardData.hebrew ? `HEBRAICO: ${cardData.hebrew} (${cardData.hebrewSymbol || ''})<br>` : ''}
        ${cardData.planet ? `REGENTE: ${cardData.planet}<br>` : ''}
        ${cardData.zodiac ? `ZODIACO: ${cardData.zodiac}<br>` : ''}
        ${cardData.path ? `PATH: ${cardData.path}<br>` : ''}
        ${cardData.element ? `ELEMENTO: ${cardData.element}<br>` : ''}
        · · · · · ·<br>
        ALIGN: ${cardData.keyword.toUpperCase()}<br>
        ${cardData.archetype ? `ARQ: ${cardData.archetype.substring(0,28).toUpperCase()}<br>` : ''}
        VECTORS: OK<br>
        SHIELD: HIGH
      `;

      const area = document.getElementById('neural-typewriter-area');
      area.innerHTML = "";
      
      let lines = [
        `CARREGANDO DADOS DE SISTEMA DO ARCANO...`,
        `DECODIFICANDO FLUXO DE SINAPSES PARA: ${cardData.name.toUpperCase()}`,
        `--- LEITURA NEURAL INICIADA ---`,
        ...cardData.neural,
        `[ PROCESSAMENTO TERMINADO - ENTRADA CONCLUIDA ]`
      ];

      let currentLine = 0;
      if (typewriterInterval) clearInterval(typewriterInterval);

      typewriterInterval = setInterval(() => {
        if (currentLine < lines.length) {
          const div = document.createElement('div');
          div.className = 'neural-typewriter-line';
          div.innerText = lines[currentLine];
          area.appendChild(div);
          area.scrollTop = area.scrollHeight;
          
          SoundManager.playTone(400 + (currentLine * 40), 'triangle', 0.04);
          currentLine++;
        } else {
          clearInterval(typewriterInterval);
        }
      }, 500);
    }

    // PERSIST HISTORIC DRAW TO LOCAL STORAGE
    function saveDrawToHistory() {
      const history = JSON.parse(localStorage.getItem('tarot_history') || '[]');
      const newEntry = {
        date: new Date().toLocaleString('pt-BR'),
        deck: configState.deck,
        type: tarotDrawType,
        cards: tarotDrawResults
      };
      // Keep last 30
      history.unshift(newEntry);
      if (history.length > 30) history.pop();
      localStorage.setItem('tarot_history', JSON.stringify(history));
    }

    function renderHistoryUI() {
      const container = document.getElementById('history-items-list');
      container.innerHTML = "";
      const history = JSON.parse(localStorage.getItem('tarot_history') || '[]');

      if (history.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px; opacity:0.6;">NENHUM HISTORICO REGISTRADO.</div>`;
        return;
      }

      history.forEach((entry, idx) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        let typeLabel = "Diaria";
        if (entry.type === 'three') typeLabel = "3 Cartas";
        if (entry.type === 'celta') typeLabel = "Celta";
        
        // Render simple titles of cards
        let cardsStr = entry.cards.map(c => getCardData(entry.deck, c.cardId).name).join(", ");
        if (cardsStr.length > 40) cardsStr = cardsStr.substring(0, 37) + "...";

        item.innerHTML = `
          <div>
            <strong>[${typeLabel.toUpperCase()}]</strong> ${cardsStr}
          </div>
          <div style="font-size:11px; opacity:0.7;">
            ${entry.date}
          </div>
        `;

        item.addEventListener('click', () => {
          // Re-load this past draw into draw results
          tarotDrawResults = entry.cards;
          tarotDrawType = entry.type;
          configState.deck = entry.deck; // restore deck style
          
          switchTarotScreen('draw');
          // Instantly open all cards flipped
          setTimeout(() => {
            tarotDrawResults.forEach((_, cidx) => {
              const c = document.getElementById(`card-draw-${cidx}`);
              if (c) c.classList.add('flipped');
            });
            updateDrawContext(0);
          }, 100);
        });

        container.appendChild(item);
      });
    }

    /* =========================================================================
       SYSTEM SHUTDOWN AND REBOOT SIMULATORS
       ========================================================================= */
    function triggerReboot() {
      const screen = document.getElementById('overlay-reboot');
      const logs = document.getElementById('reboot-logs');
      screen.classList.add('active');
      logs.innerText = "";
      
      const rebootMessages = [
        "[   0.000000] Booting Linux kernel...",
        "[   0.082103] BCM2711: CPU Core initialized.",
        "[   0.142011] Memory: 8192MB RAM mapped successfully.",
        "[   0.312003] USB Core: Controller enabled.",
        "[   0.589110] Network Daemon: initializing wifi link...",
        "[   0.880922] colmeia-core: loading local security keys...",
        "[   1.211029] Sound Driver: synth core activated.",
        "[   1.589122] INIT: Entering runlevel 3...",
        "[   1.882011] COLMEIA OS v2.0.0 - BOOT COMPLETO."
      ];

      let step = 0;
      const interval = setInterval(() => {
        if (step < rebootMessages.length) {
          logs.innerText += rebootMessages[step] + "\n";
          logs.scrollTop = logs.scrollHeight;
          SoundManager.playTone(300 + (step * 80), 'sawtooth', 0.05);
          step++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            screen.classList.remove('active');
            if (typeof Platform !== 'undefined') {
              Platform.reboot();
            } else {
              switchApp('os-menu');
            }
          }, 800);
        }
      }, 400);
    }

    function triggerShutdown() {
      const screen = document.getElementById('overlay-shutdown');
      const text = document.getElementById('shut-text');
      const line = document.getElementById('shut-line');
      
      screen.classList.add('active');
      text.style.display = "block";
      line.classList.remove('active');
      
      SoundManager.playTone(200, 'sawtooth', 0.4);
      setTimeout(() => {
        SoundManager.playTone(100, 'sawtooth', 0.5);
      }, 400);        setTimeout(() => {
          text.style.display = "none";
          line.classList.add('active');
          setTimeout(() => {
            if (typeof Platform !== 'undefined') {
              Platform.shutdown();
            }
          }, 600);
        }, 1500);
    }

    /* =========================================================================
       KEYBOARD & CLICK EVENT HANDLER (TUI EMULATION)
       ========================================================================= */
    function initNavigation(appId) {
      selectedNavIndex = 0;
      document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('selected'));
      
      if (appId === 'os-menu') {
        activeNavItems = Array.from(document.querySelectorAll('#os-menu-list .menu-item'));
        if (activeNavItems[0]) activeNavItems[0].classList.add('selected');
        updateFooterLegend("[↕] NAVEGAR   [ENTER/CLICK] SELECIONAR   [Q] DESLIGAR");
      } else if (appId === 'configs') {
        updateFooterLegend("[Q] VOLTAR AO MENU");
      } else if (appId === 'terminal') {
        updateFooterLegend("[Q] SAIR DO TERMINAL");
        document.getElementById('term-input').focus();
      } else if (appId === 'entidade') {
        updateFooterLegend("[Q] SAIR DA ENTIDADE");
        document.getElementById('chat-input').focus();
      } else if (appId === 'conexoes') {
        updateFooterLegend("[Q] SAIR");
      } else if (appId === 'sysmonitor') {
        updateFooterLegend("[Q] SAIR");
      } else if (appId === 'navegador') {
        updateFooterLegend("[1,2,3] LINKS   [Q] SAIR");
      } else if (appId === 'games') {
        updateFooterLegend("[Q] SAIR");
      }
    }

    function initTarotNavigation(screenId) {
      tarotSelectedNavIndex = 0;
      document.querySelectorAll('#tarot-menu-list .menu-item').forEach(el => el.classList.remove('selected'));
      
      if (screenId === 'menu') {
        activeNavItems = Array.from(document.querySelectorAll('#tarot-menu-list .menu-item'));
        if (activeNavItems[0]) activeNavItems[0].classList.add('selected');
        updateFooterLegend("[↕] NAVEGAR   [ENTER] CONFIRMAR   [Q] VOLTAR AO OS");
      } else if (screenId === 'draw') {
        updateFooterLegend("[←→] NAVEGAR   [ENTER] VIRAR   [I/D] NEURAL   [Q] SAIR");
      } else if (screenId === 'neural') {
        updateFooterLegend("[QUALQUER TECLA] VOLTAR AO DRAW");
      } else if (screenId === 'history') {
        updateFooterLegend("[Q] VOLTAR");
      } else if (screenId === 'about') {
        updateFooterLegend("[Q] VOLTAR");
      }
    }

    function updateFooterLegend(text) {
      document.getElementById('footer-actions').innerText = text;
    }

    // Global Key Listener
    window.addEventListener('keydown', (e) => {
      // If we are typing in text inputs, avoid hijacking standard keys
      if (document.activeElement.tagName === 'INPUT' && e.key !== 'Escape' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
        return;
      }

      // Reboot / shutdown inputs ignored
      if (document.getElementById('overlay-reboot').classList.contains('active') ||
          document.getElementById('overlay-shutdown').classList.contains('active')) {
        return;
      }

      // Trigger color glitch on interaction keys
      triggerVisualGlitch();

      // Play mechanical click key sound
      SoundManager.playKey();

      // SPLASH screen exits on any key
      if (currentApp === 'tarot' && currentTarotScreen === 'splash') {
        clearInterval(splashInterval);
        switchTarotScreen('menu');
        return;
      }

      // NEURAL Typewriter screen exits on any key
      if (currentApp === 'tarot' && currentTarotScreen === 'neural') {
        clearInterval(typewriterInterval);
        switchTarotScreen('draw');
        return;
      }

      switch(e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentApp === 'os-menu') {
            activeNavItems[selectedNavIndex].classList.remove('selected');
            selectedNavIndex = (selectedNavIndex - 1 + activeNavItems.length) % activeNavItems.length;
            activeNavItems[selectedNavIndex].classList.add('selected');
            SoundManager.playClick();
          } else if (currentApp === 'tarot' && currentTarotScreen === 'menu') {
            activeNavItems[tarotSelectedNavIndex].classList.remove('selected');
            tarotSelectedNavIndex = (tarotSelectedNavIndex - 1 + activeNavItems.length) % activeNavItems.length;
            activeNavItems[tarotSelectedNavIndex].classList.add('selected');
            SoundManager.playClick();
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentApp === 'os-menu') {
            activeNavItems[selectedNavIndex].classList.remove('selected');
            selectedNavIndex = (selectedNavIndex + 1) % activeNavItems.length;
            activeNavItems[selectedNavIndex].classList.add('selected');
            SoundManager.playClick();
          } else if (currentApp === 'tarot' && currentTarotScreen === 'menu') {
            activeNavItems[tarotSelectedNavIndex].classList.remove('selected');
            tarotSelectedNavIndex = (tarotSelectedNavIndex + 1) % activeNavItems.length;
            activeNavItems[tarotSelectedNavIndex].classList.add('selected');
            SoundManager.playClick();
          }
          break;
        case 'ArrowLeft':
          if (currentApp === 'tarot' && currentTarotScreen === 'draw') {
            e.preventDefault();
            const len = tarotDrawResults.length;
            const prevIdx = (tarotSelectedCardIndex - 1 + len) % len;
            updateDrawContext(prevIdx);
            SoundManager.playClick();
          }
          break;
        case 'ArrowRight':
          if (currentApp === 'tarot' && currentTarotScreen === 'draw') {
            e.preventDefault();
            const len = tarotDrawResults.length;
            const nextIdx = (tarotSelectedCardIndex + 1) % len;
            updateDrawContext(nextIdx);
            SoundManager.playClick();
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (currentApp === 'os-menu') {
            const action = activeNavItems[selectedNavIndex].dataset.action;
            triggerMenuAction(action);
          } else if (currentApp === 'tarot') {
            if (currentTarotScreen === 'menu') {
              const action = activeNavItems[tarotSelectedNavIndex].dataset.action;
              triggerTarotMenuAction(action);
            } else if (currentTarotScreen === 'draw') {
              // Flip the active selected card
              flipTarotCard(tarotSelectedCardIndex);
            }
          }
          break;
        case 'q':
        case 'Q':
        case 'Escape':
          e.preventDefault();
          if (currentApp === 'tarot') {
            if (currentTarotScreen === 'menu') {
              switchApp('os-menu');
            } else if (currentTarotScreen === 'draw' || currentTarotScreen === 'history' || currentTarotScreen === 'about') {
              switchTarotScreen('menu');
            }
          } else if (currentApp !== 'os-menu') {
            switchApp('os-menu');
          } else {
            // In main menu: Q triggers shutdown
            triggerShutdown();
          }
          break;
        // Shortcuts inside Tarot Draw
        case 'i':
        case 'I':
        case 'd':
        case 'D':
          if (currentApp === 'tarot' && currentTarotScreen === 'draw') {
            // Verify if card is flipped before opening neural view
            const container = document.getElementById(`card-draw-${tarotSelectedCardIndex}`);
            if (container && container.classList.contains('flipped')) {
              switchTarotScreen('neural');
              runNeuralTypewriter();
            } else {
              SoundManager.playError();
            }
          }
          break;
        case 'n':
        case 'N':
          if (currentApp === 'tarot' && currentTarotScreen === 'draw') {
            // Nova Tiragem
            switchTarotScreen('menu');
          }
          break;
        case 'l':
        case 'L':
          if (currentApp === 'tarot' && currentTarotScreen === 'draw') {
            switchTarotScreen('history');
            renderHistoryUI();
          }
          break;
      }
    });

    // Handle mouse click navigation logic for menu lists
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        SoundManager.playClick();
        if (currentApp === 'os-menu') {
          const action = item.dataset.action;
          triggerMenuAction(action);
        } else if (currentApp === 'tarot' && currentTarotScreen === 'menu') {
          const action = item.dataset.action;
          triggerTarotMenuAction(action);
        }
      });
    });

    function triggerMenuAction(action) {
      if (action === 'reboot') triggerReboot();
      else if (action === 'shutdown') triggerShutdown();
      else switchApp(action);
    }

    function triggerTarotMenuAction(action) {
      if (action === 'tarot-back') {
        switchApp('os-menu');
      } else if (action === 'tarot-about') {
        switchTarotScreen('about');
      } else if (action === 'tarot-history') {
        switchTarotScreen('history');
        renderHistoryUI();
      } else if (action === 'tarot-deck-switch') {
        const decks = ['cyberpunk', 'rws', 'thoth', 'marselha'];
        const currentIdx = decks.indexOf(configState.deck);
        configState.deck = decks[(currentIdx + 1) % decks.length];
        saveConfigs();
        const label = document.getElementById('tarot-deck-current');
        if (label) label.innerText = configState.deck.toUpperCase();
        SoundManager.playSuccess();
        triggerVisualGlitch();
      } else {
        // Draw options
        if (action === 'draw-daily') tarotDrawType = 'daily';
        else if (action === 'draw-three') tarotDrawType = 'three';
        else if (action === 'draw-celta') tarotDrawType = 'celta';
        
        switchTarotScreen('shuffle');
        runShuffleAnimation();
      }
    }

    /* =========================================================================
       CONFIGS SCREEN INPUT HANDLERS & RESET
       ========================================================================= */
    document.getElementById('config-color-theme').addEventListener('change', (e) => {
      configState.theme = e.target.value;
      saveConfigs();
      applyConfigs();
      SoundManager.playSuccess();
    });

    document.getElementById('config-crt').addEventListener('change', (e) => {
      configState.crt = e.target.value;
      saveConfigs();
      applyConfigs();
      SoundManager.playSuccess();
    });

    document.getElementById('config-audio').addEventListener('change', (e) => {
      configState.audio = e.target.value;
      saveConfigs();
      applyConfigs();
      SoundManager.playSuccess();
    });

    document.getElementById('config-volume').addEventListener('change', (e) => {
      configState.volume = e.target.value;
      saveConfigs();
      applyConfigs();
      SoundManager.playSuccess();
    });

    document.getElementById('config-tarot-deck').addEventListener('change', (e) => {
      configState.deck = e.target.value;
      saveConfigs();
      applyConfigs();
      SoundManager.playSuccess();
    });

    document.getElementById('btn-clear-data').addEventListener('click', () => {
      if (confirm("Deseja realmente apagar o historico de Tarot e redefinir as configuracoes?")) {
        localStorage.clear();
        configState = {
          theme: 'default',
          crt: 'on',
          audio: 'on',
          volume: 'medium',
          deck: 'cyberpunk'
        };
        applyConfigs();
        SoundManager.playSuccess();
        alert("Sistema redefinido com sucesso.");
      } else {
        SoundManager.playError();
      }
    });

    /* =========================================================================
       INITIALIZATION CODE
       ========================================================================= */
    async function detectSystemInfo() {
      if (typeof Platform !== 'undefined') {
        await Platform.init();
        await pollSystemInfo();
      }
    }

    window.onload = async () => {
      loadConfigs();
      initNavigation('os-menu');
      initBreechProtocol();
      loadWebpage('cyber://colmeia.node');
      await detectSystemInfo();
      
      // Auto-trigger click sound and glitch on any body click
      document.body.addEventListener('click', (e) => {
        triggerVisualGlitch();
        if (e.target.tagName !== 'SELECT' && e.target.tagName !== 'BUTTON' && !e.target.closest('.card-container') && !e.target.closest('.breech-cell')) {
          SoundManager.playClick();
        }
      });

      // Allow click skip on splash screen
      document.getElementById('tarot-screen-splash').addEventListener('click', () => {
        if (currentTarotScreen === 'splash') {
          clearInterval(splashInterval);
          switchTarotScreen('menu');
        }
      });
    };
