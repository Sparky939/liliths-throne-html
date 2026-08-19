"use strict";
(function () {
    // Ported from upstream PR #5 (SupernovaXTS): GameCharacter migrated from a
    // constructor-function-plus-prototype into a real class, split out of
    // player.ts into its own file (player.ts keeps only the free-standing
    // LT.* helpers that aren't part of the character object itself).
    //
    // One thing deliberately NOT ported: upstream's constructor also does
    // `this.slots = structuredClone(LT.slots)` followed by
    // `for (const slot of this.slots) { slot.owner = this.id; }`. Confirmed by
    // running upstream's actual character.js: `LT.slots` (lowercase) is never
    // defined anywhere in the PR branch, so `structuredClone(undefined)` is
    // undefined and the `for...of` throws `TypeError: this.slots is not
    // iterable` on every single character construction — the game couldn't
    // even start. See clothing.ts's comment for the rest of that broken
    // feature (a `Slot` class with an infinitely-recursive get/set owner()
    // pair, and inventory.js/creationFinish.js changes that would blank the
    // whole inventory panel). Skipped entirely rather than guessed at, since
    // it needs real design this PR doesn't actually specify.
    //
    // `Character` (the canonical player-shape type, global.d.ts) is kept as
    // the public interface every other file already annotates against — this
    // class implements it rather than replacing it, so the large existing
    // surface of `: Character` annotations across the codebase (slavery.ts,
    // statusEffects.ts, combat.ts, content/text files, etc.) keeps working
    // unchanged, including Character's index signature for the many dynamic
    // extra fields those files attach.
    class GameCharacter {
        constructor(opts) {
            opts = opts || {};
            this.id = opts.id;
            this.player = !!opts.player;
            this.raceName = opts.raceName || "HUMAN";
            this.names = { masculine: "Unknown", androgynous: "Unknown", feminine: "Unknown" };
            this.surname = "";
            this.gender = LT.Gender.FEMALE;
            this.femininityValue = 70;
            this.orientation = LT.Orientation.AMBIPHILIC;
            this.personality = {};
            this.birthday = new Date(1997, 5, 15);
            this.level = 1;
            this.experience = 0;
            this.experienceForLevel = 10;
            this.physique = 10;
            this.arcane = 10;
            this.maxHealth = LT.maxHealthOf(this);
            this.health = this.maxHealth;
            this.maxMana = LT.maxManaOf(this);
            this.mana = this.maxMana;
            this.corruption = 0;
            this.arousal = 0;
            this.lust = 10;
            this.essences = 0;
            this.knownSpells = [];
            this.items = [];
            this.money = 0;
            this.location = null;
            this.equipped = {};
            this.wardrobe = [];
            this.mainWeapon = null;
            this.offhandWeapon = null;
            this.weapons = [];
            this.occupation = null;
            this.sex = {
                vaginal: 0,
                anal: 0,
                oral: 0,
                penisVirgin: true,
                vaginaVirgin: true,
            };
            this.applyHumanDefaults();
        }
        isPlayer() {
            return this.player;
        }
        isFeminine() {
            return this.femininityValue >= 50 || this.gender.feminine;
        }
        getFemininity() {
            return LT.femininityFromValue(this.femininityValue);
        }
        getFemininityValue() {
            return this.femininityValue;
        }
        setFemininity(entry) {
            this.femininityValue = typeof entry === "number" ? entry : entry.value;
        }
        getGender() {
            return this.gender;
        }
        setGender(gender) {
            var changed = this.gender !== gender;
            this.gender = gender;
            if (gender === LT.Gender.FEMALE && this.femininityValue < 50)
                this.femininityValue = 70;
            if (gender === LT.Gender.MALE && this.femininityValue > 50)
                this.femininityValue = 30;
            this.penisPresent = !!(gender && gender.hasPenis);
            this.vaginaPresent = !!(gender && gender.hasVagina);
            if (changed)
                this.applyHumanDefaults();
        }
        hasPenis() {
            if (this.body && this.body.penis)
                return this.body.penis.type !== "NONE";
            if (this.penisPresent != null)
                return !!this.penisPresent;
            return !!(this.gender && this.gender.hasPenis);
        }
        hasVagina() {
            if (this.body && this.body.vagina)
                return this.body.vagina.type !== "NONE";
            if (this.vaginaPresent != null)
                return !!this.vaginaPresent;
            return !!(this.gender && this.gender.hasVagina);
        }
        hasBreasts() {
            return !!(this.gender && this.gender.hasBreasts) || (this.breastSize && this.breastSize.id !== "FLAT");
        }
        applyHumanDefaults() {
            var f = this.isFeminine();
            this.heightCm = f ? 168 : 178;
            this.skin = LT.findById(LT.SKIN, "LIGHT");
            this.bodySize = LT.BODY_SIZE.TWO_AVERAGE;
            this.muscle = f ? LT.MUSCLE.ONE_LIGHTLY : LT.MUSCLE.TWO_TONED;
            this.lipSize = f ? LT.LIP.TWO_FULL : LT.LIP.ONE_AVERAGE;
            this.lipsPuffy = false;
            this.eye = LT.findById(LT.EYE, "BROWN");
            this.hairLength = f ? LT.HAIR_LENGTH.FOUR_LONG : LT.HAIR_LENGTH.TWO_SHORT;
            this.hairStyle = f ? LT.findById(LT.HAIR_STYLE, "WAVY") : LT.findById(LT.HAIR_STYLE, "MESSY");
            this.hair = LT.findById(LT.HAIR_COLOUR, "BROWN");
            this.breastSize = f ? LT.CUP.C : LT.CUP.FLAT;
            this.breastShape = LT.findById(LT.BREAST_SHAPE, "ROUND");
            this.nippleSize = LT.SIZE5[f ? 2 : 1];
            this.areolaeSize = LT.SIZE5[f ? 2 : 1];
            this.nipplesPuffy = false;
            this.assSize = LT.SIZE5[f ? 3 : 2];
            this.hipSize = LT.SIZE5[f ? 3 : 2];
            this.anusBleached = false;
            this.penisLength = 15;
            this.testicleSize = LT.SIZE5[2];
            this.vaginaCapacity = LT.SIZE5[2];
            this.labiaSize = LT.SIZE5[2];
            this.clitorisSize = LT.SIZE5[0];
            if (typeof LT.createBody === "function") {
                this.body = LT.createBody({
                    feminine: f,
                    hasPenis: this.penisPresent != null ? !!this.penisPresent : !!(this.gender && this.gender.hasPenis),
                    hasVagina: this.vaginaPresent != null ? !!this.vaginaPresent : !!(this.gender && this.gender.hasVagina),
                    hasBreasts: !!(this.gender && this.gender.hasBreasts) || f,
                    height: this.heightCm,
                    femininity: this.femininityValue,
                    bodySize: this.bodySize,
                    muscle: this.muscle,
                    skin: this.skin,
                    lipSize: this.lipSize,
                    lipsPuffy: this.lipsPuffy,
                    eye: this.eye,
                    hairLength: this.hairLength,
                    hairStyle: this.hairStyle,
                    hair: this.hair,
                    breastSize: this.breastSize,
                    breastShape: this.breastShape,
                    nippleSize: this.nippleSize,
                    areolaeSize: this.areolaeSize,
                    nipplesPuffy: this.nipplesPuffy,
                    assSize: this.assSize,
                    hipSize: this.hipSize,
                    anusBleached: this.anusBleached,
                    penisLength: this.penisLength,
                    testicleSize: this.testicleSize,
                    vaginaCapacity: this.vaginaCapacity && this.vaginaCapacity.id,
                    labiaSize: this.labiaSize,
                    clitorisSize: this.clitorisSize,
                    race: this.raceName || "HUMAN",
                });
            }
            if (typeof LT.ensureCharacterSystems === "function")
                LT.ensureCharacterSystems(this);
        }
        getBodyShape() {
            return LT.bodyShapeOf(this.bodySize, this.muscle);
        }
        describeBody() {
            return LT.describeBody(this);
        }
        getName() {
            if (this.femininityValue < 40)
                return this.names.masculine;
            if (this.femininityValue > 60)
                return this.names.feminine;
            return this.names.androgynous;
        }
        setName(masculine, androgynous, feminine) {
            this.names = {
                masculine: masculine,
                androgynous: androgynous || masculine,
                feminine: feminine || masculine,
            };
        }
        getRaceName() {
            var raw = this.fullRace || this.raceName || "human";
            return raw.charAt(0).toUpperCase() + raw.slice(1);
        }
        getAgeValue(now) {
            now = now || (typeof LT.gameNow === "function" ? LT.gameNow() : new Date(2019, 9, 1));
            var age = now.getFullYear() - this.birthday.getFullYear();
            var md = now.getMonth() * 32 + now.getDate();
            var bd = this.birthday.getMonth() * 32 + this.birthday.getDate();
            if (md < bd)
                age -= 1;
            return age;
        }
        setAge(age, now) {
            now = now || (typeof LT.gameNow === "function" ? LT.gameNow() : new Date(2019, 9, 1));
            var clamped = Math.max(18, Math.min(50, age));
            var month = this.birthday.getMonth();
            var date = this.birthday.getDate();
            var year = now.getFullYear() - clamped;
            var md = now.getMonth() * 32 + now.getDate();
            var bd = month * 32 + date;
            if (md < bd)
                year -= 1;
            this.birthday = new Date(year, month, date);
        }
        hasPersonalityTrait(id) {
            return !!this.personality[id];
        }
        togglePersonality(id) {
            var trait = null;
            for (var i = 0; i < LT.PERSONALITY.length; i++) {
                if (LT.PERSONALITY[i].id === id) {
                    trait = LT.PERSONALITY[i];
                    break;
                }
            }
            if (!trait)
                return;
            if (this.personality[id]) {
                delete this.personality[id];
                return;
            }
            var exclusive = trait.exclusive || [];
            for (var j = 0; j < exclusive.length; j++)
                delete this.personality[exclusive[j]];
            this.personality[id] = true;
        }
        she() {
            return this.isFeminine() ? "she" : "he";
        }
        her() {
            return this.isFeminine() ? "her" : "his";
        }
        getGenderColour() {
            return this.gender.colour || LT.Colour.ANDROGYNOUS;
        }
    }
    LT.GameCharacter = GameCharacter;
})();
//# sourceMappingURL=character.js.map